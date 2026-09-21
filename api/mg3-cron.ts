import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Configuração do Firebase para Node.js
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Evitar inicialização dupla no ambiente serverless
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Simples proteção via token
  const token = req.query.token || req.headers.authorization;
  if (token !== process.env.CRON_SECRET && token !== 'mg3secret2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const momento = req.query.momento as string; // Ex: HORA1, HORA2, etc.
  
  try {
    const mercadoSnap = await getDocs(collection(db, 'mg3_mercado'));
    const ativos = mercadoSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let cenariosConfig: any = null;
    let logOperacoes: string[] = [];

    // Se tiver momento (Gatilho de Cenário)
    if (momento) {
      const cenariosSnap = await getDocs(collection(db, 'mg3_cenarios'));
      if (!cenariosSnap.empty) {
        cenariosConfig = cenariosSnap.docs[0].data().cenarios;
      }

      if (!cenariosConfig || !cenariosConfig[momento]) {
        return res.status(400).json({ error: `Cenário ${momento} não encontrado no banco.` });
      }

      const variacoesSetores = cenariosConfig[momento];

      for (const ativo of ativos) {
        if (ativo.tipo !== 'rendaVariavel' && ativo.tipo !== 'acao') continue;
        
        const variacaoPercentual = variacoesSetores[ativo.setor] || 0;
        
        if (variacaoPercentual !== 0) {
          const precoAtual = ativo.precoAtual || 1;
          const fator = 1 + (variacaoPercentual / 100);
          const novoPreco = parseFloat((precoAtual * fator).toFixed(2));

          await updateDoc(doc(db, 'mg3_mercado', ativo.id), {
            precoAtual: novoPreco
          });
          logOperacoes.push(`CENÁRIO ${momento}: ${ativo.ticker} (${ativo.setor}) ajustado de ${precoAtual} para ${novoPreco} (${variacaoPercentual > 0 ? '+' : ''}${variacaoPercentual}%)`);
        }
      }

      return res.status(200).json({ success: true, message: `Cenário ${momento} executado com sucesso.`, logs: logOperacoes });
    } 
    // Modo Contínuo (Oferta e Demanda)
    else {
      // Sensibilidade da variação (quanto 1 unidade a mais de demanda afeta o preço em %)
      // Ajuste esse valor dependendo do volume esperado pelos alunos.
      const FATOR_SENSIBILIDADE = 0.005; // 0.5% por diferença unitária

      for (const ativo of ativos) {
        if (ativo.tipo !== 'rendaVariavel' && ativo.tipo !== 'acao') continue;

        const demanda = ativo.demanda || 0;
        const oferta = ativo.oferta || 0;
        const diferenca = demanda - oferta;

        if (diferenca !== 0) {
          const precoAtual = ativo.precoAtual || 1;
          
          // Limite máximo de variação por ciclo para evitar anomalias (ex: max 20% por ciclo)
          let fatorVariacao = diferenca * FATOR_SENSIBILIDADE;
          if (fatorVariacao > 0.2) fatorVariacao = 0.2;
          if (fatorVariacao < -0.2) fatorVariacao = -0.2;

          const novoPreco = parseFloat((precoAtual * (1 + fatorVariacao)).toFixed(2));

          // Atualiza o preço e zera a oferta/demanda para o próximo ciclo
          await updateDoc(doc(db, 'mg3_mercado', ativo.id), {
            precoAtual: novoPreco,
            oferta: 0,
            demanda: 0
          });

          logOperacoes.push(`MERCADO: ${ativo.ticker} ajustado de ${precoAtual} para ${novoPreco} (Demanda: ${demanda}, Oferta: ${oferta})`);
        }
      }

      return res.status(200).json({ success: true, message: 'Ciclo de mercado concluído.', logs: logOperacoes });
    }
  } catch (error: any) {
    console.error("Erro no mg3-cron:", error);
    return res.status(500).json({ error: error.message });
  }
}
