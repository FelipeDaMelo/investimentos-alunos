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
            return {
              ...ativo,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: rendimento,
              },
            };
          } else {
            const valorAtual = await fetchValorAtual(ativo.nome);
            const updatedPatrimonio = ativo.tipo === 'cripto'
              ? ativo.valorInvestido / parseFloat(valorAtual)
              : ativo.valorInvestido * parseFloat(valorAtual);
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
