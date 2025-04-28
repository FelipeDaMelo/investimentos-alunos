import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoFixa from './calcularRendimentoFixa'; // import correto agora!

type AtualizarAtivosCallback = (ativosAtualizados: Ativo[]) => void;

const useAtualizarAtivos = (ativos: Ativo[], atualizarCallback: AtualizarAtivosCallback) => {
  useEffect(() => {
    const atualizar = async () => {
      if (ativos.length === 0) return;

      const hoje = new Date().toISOString().split('T')[0];

      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const diasPassados = Math.max(0, Math.floor(
              (new Date(hoje).getTime() - new Date(ativo.dataInvestimento).getTime()) / (1000 * 60 * 60 * 24)
            ));

            const rendimento = await calcularRendimentoFixa(ativo as RendaFixaAtivo, diasPassados);

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
            const valorAtualString = await fetchValorAtual(ativoVar.tickerFormatado);
            const valorAtual = parseFloat(valorAtualString);
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

      atualizarCallback(updatedAtivos);
    };

    atualizar();

    const intervalId = setInterval(atualizar, 86400000); // Atualizar a cada 24 horas
    return () => clearInterval(intervalId);
  }, [ativos, atualizarCallback]);
};

export default useAtualizarAtivos;
