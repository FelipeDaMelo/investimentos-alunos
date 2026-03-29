// Caminho: src/hooks/useAtualizarAtivos.tsx
// ✅ VERSÃO FINAL CORRIGIDA E SIMPLIFICADA

import { useEffect, useRef } from 'react';
import { Ativo } from '../types/Ativo';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { atualizarAtivos } from '../utils/atualizarAtivos'; // Importa a nossa função orquestradora

type AtualizarAtivosCallback = (ativosAtualizados: Ativo[]) => void;

/**
 * Hook para gerenciar a atualização automática dos ativos uma vez por dia.
 * Ele verifica se a carteira já foi atualizada hoje e, caso não tenha sido,
 * dispara o processo de atualização.
 */
const useAtualizarAtivos = (
  ativos: Ativo[],
  atualizarCallback: AtualizarAtivosCallback,
  login: string
) => {
  // Usamos ref para ter a versão mais recente dos ativos sem causar re-renderizações no useEffect
  const ativosRef = useRef<Ativo[]>(ativos);

  useEffect(() => {
    ativosRef.current = ativos;
  }, [ativos]);

  useEffect(() => {
    const verificarEAtualizarAutomaticamente = async () => {
      if (!login || !ativosRef.current || ativosRef.current.length === 0) {
        return; // Não executa se não houver login ou ativos
      }

      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const ultimaDataAtualizacao = docSnap.data().ultimaAtualizacao;
      const hoje = new Date().toISOString().split('T')[0];

      // A principal condição: se a última atualização foi antes de hoje, atualiza.
      if (!ultimaDataAtualizacao || ultimaDataAtualizacao < hoje) {
        console.log('Realizando atualização automática de ativos...');
        
        try {
          // 1. Primeiro, obtemos os preços e rendimentos atualizados com base na lista que temos agora.
          // Note que isso pode levar alguns segundos.
          const ativosComNovosPrecos = await atualizarAtivos(ativosRef.current, hoje);
          
          // 2. Agora usamos uma TRANSAÇÃO para salvar, garantindo que não vamos atropelar 
          // novos ativos que possam ter sido adicionados durante os segundos acima.
          await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(docRef);
            if (!userDoc.exists()) return;

            const ativosNoBanco = (userDoc.data().ativos || []) as Ativo[];

            // 3. MERGE SEGURO:
            // Percorremos os ativos QUE ESTÃO NO BANCO agora e aplicamos os novos preços 
            // que calculamos no passo 1 (se o ativo ainda existir).
            const mergeFinal = ativosNoBanco.map(ativoBanco => {
              const atualizado = ativosComNovosPrecos.find(a => a.id === ativoBanco.id);
              if (atualizado) {
                // Preservamos o objeto do banco (que pode ter quantidades novas) 
                // e apenas atualizamos o valor e o histórico de patrimônio do dia.
                return {
                  ...ativoBanco,
                  valorAtual: atualizado.valorAtual,
                  patrimonioPorDia: {
                    ...ativoBanco.patrimonioPorDia,
                    [hoje]: atualizado.patrimonioPorDia[hoje]
                  }
                };
              }
              return ativoBanco; // Se for um ativo novo que não estava no passo 1, mantemos ele como está.
            });

            transaction.update(docRef, {
              ativos: mergeFinal,
              ultimaAtualizacao: hoje,
            });

            // 4. Atualiza o estado da UI
            atualizarCallback(mergeFinal);
          });
          
          console.log('Atualização automática concluída com sucesso.');

        } catch (error) {
          console.error('Erro durante a atualização automática de ativos:', error);
        }
      } else {
        console.log('Ativos já atualizados hoje. Nenhuma atualização automática necessária.');
      }
    };

    // Um pequeno delay para não competir com o carregamento inicial de dados.
    const timer = setTimeout(verificarEAtualizarAutomaticamente, 5000);

    return () => clearTimeout(timer);

  }, [login, atualizarCallback]); // Dependências corretas para a lógica
};


// As funções para atualização manual permanecem as mesmas
export async function salvarUltimaAtualizacaoManual(usuarioId: string) {
  const ref = doc(db, 'usuarios', usuarioId);
  await updateDoc(ref, {
    // Pode ser interessante salvar a data da última atualização manual e automática separadamente
    ultimaAtualizacaoManual: new Date().toISOString()
  });
}

export async function obterUltimaAtualizacaoManual(usuarioId: string): Promise<Date | null> {
  const ref = doc(db, 'usuarios', usuarioId);
  const docSnap = await getDoc(ref);
  if (docSnap.exists() && docSnap.data().ultimaAtualizacaoManual) {
    return new Date(docSnap.data().ultimaAtualizacaoManual);
  }
  return null;
}

export default useAtualizarAtivos;