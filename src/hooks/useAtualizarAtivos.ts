import { useEffect, useRef } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoFixa from './calcularRendimentoFixa';

type AtualizarAtivosCallback = (ativosAtualizados: Ativo[]) => void;

const useAtualizarAtivos = (ativos: Ativo[], atualizarCallback: AtualizarAtivosCallback) => {
  const ativosRef = useRef<Ativo[]>(ativos);

  useEffect(() => {
    ativosRef.current = ativos;
  }, [ativos]);

  useEffect(() => {
    const fetchDividendoFII = async (ticker: string): Promise<number> => {
      try {
        const url = `https://api.suno.com.br/api/open/fiis/${ticker}/dividends`;
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data)) return 0;

        const hoje = new Date();
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();

        const dividendoAtual = data.find((item: any) => {
          const dataPagamento = new Date(item.paymentDate);
          return (
            dataPagamento.getMonth() + 1 === mesAtual &&
            dataPagamento.getFullYear() === anoAtual
          );
        });

        return dividendoAtual ? parseFloat(dividendoAtual.dividend) : 0;
      } catch (error) {
        console.error('Erro ao buscar dividendo do FII:', error);
        return 0;
      }
    };

    const atualizar = async () => {
      if (ativosRef.current.length === 0) return;

      const hoje = new Date().toISOString().split('T')[0];

      const updatedAtivos = await Promise.all(
        ativosRef.current.map(async (ativo) => {
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
            let updatedPatrimonio = ativoVar.quantidade * valorAtual;

            if (ativoVar.subtipo === 'fii') {
              const dividendo = await fetchDividendoFII(ativoVar.tickerFormatado);
              const totalDividendos = dividendo * ativoVar.quantidade;
              updatedPatrimonio += totalDividendos;
            }

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

    const agendarPrimeiraAtualizacao = () => {
      const agora = new Date();
      const horarioBrasilia = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000 - (3 * 3600000));
      const proximoMeioDia = new Date(horarioBrasilia);
      proximoMeioDia.setHours(12, 0, 0, 0);

      if (horarioBrasilia > proximoMeioDia) {
        proximoMeioDia.setDate(proximoMeioDia.getDate() + 1);
      }

      const tempoAteProximaAtualizacao = proximoMeioDia.getTime() - horarioBrasilia.getTime();

      const timeoutId = setTimeout(() => {
        atualizar();
        setInterval(atualizar, 86400000);
      }, tempoAteProximaAtualizacao);

      return () => clearTimeout(timeoutId);
    };

    const limparTimeout = agendarPrimeiraAtualizacao();
    return limparTimeout;

  }, [atualizarCallback]);
};

export default useAtualizarAtivos;
