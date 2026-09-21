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
