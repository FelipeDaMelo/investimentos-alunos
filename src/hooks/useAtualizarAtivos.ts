// src/hooks/useAtualizarAtivos.ts
import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';

interface Ativo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: string | number;
  patrimonioPorDia: { [key: string]: number };
  tipo?: 'rendaVariavel' | 'rendaFixa' | 'cripto';
  categoriaFixa?: 'prefixada' | 'posFixada' | 'hibrida';
  parametrosFixa?: {
    taxaPrefixada?: number;
    percentualSobreCDI?: number;
    percentualSobreSELIC?: number;
    ipca?: number;
  };
  fracaoAdquirida?: number;
}

type SetAtivos = React.Dispatch<React.SetStateAction<Ativo[]>>;

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos) => {
  useEffect(() => {
    const atualizar = async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const diasPassados = Math.floor(
              (new Date(hoje).getTime() - new Date(ativo.dataInvestimento).getTime()) / (1000 * 60 * 60 * 24)
            );
            let rendimento = ativo.valorInvestido;

            if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
              const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
              rendimento = ativo.valorInvestido * Math.pow(1 + diaria, diasPassados);
            }

            if (ativo.categoriaFixa === 'posFixada') {
              const percentualCDI = ativo.parametrosFixa?.percentualSobreCDI;
              const percentualSELIC = ativo.parametrosFixa?.percentualSobreSELIC;
              if (percentualCDI !== undefined) {
                const diaria = percentualCDI / 100 / 252;
                rendimento = ativo.valorInvestido * Math.pow(1 + diaria, diasPassados);
              } else if (percentualSELIC !== undefined) {
                const diaria = percentualSELIC / 100 / 252;
                rendimento = ativo.valorInvestido * Math.pow(1 + diaria, diasPassados);
              }
            }

            if (
              ativo.categoriaFixa === 'hibrida' &&
              ativo.parametrosFixa?.taxaPrefixada !== undefined &&
              ativo.parametrosFixa?.ipca !== undefined
            ) {
              const diariaPrefixada = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
              const diariaIPCA = ativo.parametrosFixa.ipca / 100 / 252;
              rendimento = ativo.valorInvestido * Math.pow(1 + diariaPrefixada + diariaIPCA, diasPassados);
            }

            return {
              ...ativo,
              valorAtual: rendimento,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: rendimento,
              },
            };
          } else {
            const valorAtual = await fetchValorAtual(ativo.nome);
            const updatedPatrimonio = ativo.tipo === 'cripto'
              ? parseFloat(valorAtual) * (ativo.fracaoAdquirida ?? 0)
              : parseFloat(valorAtual) * (ativo.valorInvestido / parseFloat(valorAtual));

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
  }, []);
};

export default useAtualizarAtivos;
