import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ativo } from '../types/Ativo';

export const atualizarAtivosMG3 = async (ativos: Ativo[], hoje: string): Promise<Ativo[]> => {
  const ativosAtualizados = await Promise.all(
    ativos.map(async (ativo) => {
      let novoValorAtual = ativo.valorAtual;
      
      try {
        if (ativo.tipo === 'rendaVariavel') {
          const tickerBuscado = ativo.tickerFormatado.replace('.SA', '').replace('-USD', '').toUpperCase();
          const q = query(collection(db, 'mg3_mercado'), where('ticker', '==', tickerBuscado));
          const snap = await getDocs(q);
          if (!snap.empty) {
            novoValorAtual = snap.docs[0].data().precoAtual;
          }
        } else if (ativo.tipo === 'rendaFixa') {
          // Busca o ativo no mercado MG3 pelo nome
          const q = query(collection(db, 'mg3_mercado'), where('nome', '==', ativo.nome));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const taxaRendimentoHora = snap.docs[0].data().taxaRendimentoHora || 0;
            if (taxaRendimentoHora > 0) {
              // No MG3, capitalizamos a renda fixa a cada 10 minutos fechados.
              // O ativo.id é o timestamp da compra
              const timestampCompra = parseInt(ativo.id);
              if (!isNaN(timestampCompra)) {
                const msPassados = Date.now() - timestampCompra;
                const blocos10Min = Math.floor(msPassados / (10 * 60 * 1000));
                
                // Compõe a taxa horária para blocos de 10 minutos
                const fator10Min = Math.pow(1 + taxaRendimentoHora, 10 / 60);
                
                // Calcula o valor atual sempre a partir do valor investido para máxima precisão e imunidade a fechamento de abas
                const novoValorTotal = ativo.valorInvestido * Math.pow(fator10Min, blocos10Min);
                novoValorAtual = parseFloat(novoValorTotal.toFixed(4));
              }
            }
          }
        }
      } catch (error) {
        console.error(`Erro ao atualizar ativo MG3 ${ativo.nome}:`, error);
      }

      return {
        ...ativo,
        valorAtual: novoValorAtual,
        patrimonioPorDia: {
          ...ativo.patrimonioPorDia,
          [hoje]: ativo.tipo === 'rendaFixa' ? novoValorAtual : (ativo as any).quantidade * novoValorAtual,
        },
      };
    })
  );

  return ativosAtualizados;
};
