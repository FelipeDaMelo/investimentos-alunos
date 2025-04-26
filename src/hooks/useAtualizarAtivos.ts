import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

type SetAtivos = React.Dispatch<React.SetStateAction<Ativo[]>>;

const calcularRendimentoFixa = (ativo: RendaFixaAtivo, minutosPassados: number): number => {
  let rendimento = ativo.valorInvestido;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
    rendimento *= Math.pow(1 + diaria, minutosPassados);
  }

  if (ativo.categoriaFixa === 'posFixada') {
    const { percentualCDI, percentualSELIC } = ativo.parametrosFixa || {};
    if (percentualCDI !== undefined) {
      const diaria = percentualCDI / 100 / 252;
      rendimento *= Math.pow(1 + diaria, minutosPassados);
    } else if (percentualSELIC !== undefined) {
      const diaria = percentualSELIC / 100 / 252;
      rendimento *= Math.pow(1 + diaria, minutosPassados);
    }
  }

  if (ativo.categoriaFixa === 'hibrida') {
    const diariaPrefixada = (ativo.parametrosFixa?.taxaPrefixada || 0) / 100 / 252;
    const diariaIPCA = (ativo.parametrosFixa?.ipca || 0) / 100 / 252;
    rendimento *= Math.pow(1 + diariaPrefixada + diariaIPCA, minutosPassados);
  }

  return rendimento;
};

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos, login: string) => {
  useEffect(() => {
    // Proteção: só roda se houver ativos carregados
    if (ativos.length === 0) return;

    const atualizar = async () => {
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];

      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          // Calcular a quantidade de minutos passados desde o investimento
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

      // Atualizando no Firestore
      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, {
        ativos: updatedAtivos,
      });
    };

    atualizar(); // Executa a atualização inicialmente

    const intervalId = setInterval(atualizar, 60 * 1000); // Executa a cada 1 minuto
    return () => clearInterval(intervalId); // Limpa o intervalo ao desmontar o componente
  }, [ativos, setAtivos, login]); // Dependências ajustadas

};

export default useAtualizarAtivos;
