//src/hooks/useAtualizarAtivos.ts
import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';

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

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos) => {
  useEffect(() => {
    const atualizar = async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const diasPassados = Math.max(0, Math.floor(
              (new Date(hoje).getTime() - new Date(ativo.dataInvestimento).getTime()) / (1000 * 60 * 60 * 24)
            ));
            const rendimento = calcularRendimentoFixa(ativo as RendaFixaAtivo, diasPassados);

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
            const updatedPatrimonio = ativoVar.quantidade * valorAtual;

            return {
              ...ativo,
              valorAtual,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: updatedPatrimonio,
              },
            };
          }
        })
      );
      setAtivos(updatedAtivos);
    };

    atualizar();
    const intervalId = setInterval(atualizar, 86400000);
    return () => clearInterval(intervalId);
  }, [ativos, setAtivos]);
};

export default useAtualizarAtivos;