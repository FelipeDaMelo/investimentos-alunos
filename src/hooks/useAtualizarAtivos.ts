import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type SetAtivos = React.Dispatch<React.SetStateAction<Ativo[]>>;

const calcularRendimentoFixa = (ativo: RendaFixaAtivo, diasPassados: number): number => {
  let rendimento = ativo.valorInvestido;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
    rendimento *= Math.pow(1 + diaria, diasPassados);
  }

  if (ativo.categoriaFixa === 'posFixada') {
    const { percentualCDI, percentualSELIC } = ativo.parametrosFixa || {};
    if (percentualCDI !== undefined) {
      const diaria = percentualCDI / 100 / 252;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    } else if (percentualSELIC !== undefined) {
      const diaria = percentualSELIC / 100 / 252;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    }
  }

  if (ativo.categoriaFixa === 'hibrida') {
    const diariaPrefixada = (ativo.parametrosFixa?.taxaPrefixada || 0) / 100 / 252;
    const diariaIPCA = (ativo.parametrosFixa?.ipca || 0) / 100 / 252;
    rendimento *= Math.pow(1 + diariaPrefixada + diariaIPCA, diasPassados);
  }

  return rendimento;
};

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos, login: string) => {
  useEffect(() => {
    // ✅ Proteção: só roda se houver ativos carregados
    if (ativos.length === 0) return;

    const atualizar = async () => {
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];

      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          // TESTE: 1 minuto = 1 dia
          const minutosPassados = Math.max(
            0,
            Math.floor((agora.getTime() - new Date(ativo.dataInvestimento).getTime()) / (1000 * 60))
          );

          if (ativo.tipo === 'rendaFixa') {
            const rendimento = calcularRendimentoFixa(ativo as RendaFixaAtivo, minutosPassados);

            return {
              ...ativo,
              valorAtual: rendimento,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: rendimento,
              },
            };
          } else {
            const ativoVar = ativo as RendaVariavelAtivo;
            const valorAtual = parseFloat(await fetchValorAtual(ativoVar.tickerFormatado));
            const patrimonio = ativoVar.quantidade * valorAtual;

            return {
              ...ativo,
              valorAtual,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: patrimonio,
              },
            };
          }
        })
      );

      setAtivos(updatedAtivos);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, {
        ativos: updatedAtivos,
      });
    };

    atualizar();

    const intervalId = setInterval(atualizar, 60 * 1000); // 1 minuto para simular 1 dia
    return () => clearInterval(intervalId);
  }, [ativos, setAtivos, login]);
};

export default useAtualizarAtivos;
