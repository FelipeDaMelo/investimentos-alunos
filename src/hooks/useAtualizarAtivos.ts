import { useEffect, useRef } from 'react';
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

const ativosMudaram = (novos: Ativo[], antigos: Ativo[]): boolean => {
  return JSON.stringify(novos) !== JSON.stringify(antigos);
};

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos, login: string) => {
  const ativosRef = useRef(ativos);

  useEffect(() => {
    if (ativos.length === 0) return;
    ativosRef.current = ativos;

    const atualizar = async () => {
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];

      const updatedAtivos = await Promise.all(
        ativosRef.current.map(async (ativo) => {
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
            const novoValor = parseFloat(await fetchValorAtual(ativoVar.tickerFormatado));
            const patrimonio = ativoVar.quantidade * novoValor;

            return {
              ...ativo,
              valorAtual: novoValor,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: patrimonio,
              },
            };
          }
        })
      );

      // Sempre atualiza o estado local (para o gráfico)
      setAtivos(updatedAtivos);
      ativosRef.current = updatedAtivos;

      // Só atualiza o Firestore se houver mudança real nos ativos
      if (ativosMudaram(updatedAtivos, ativosRef.current)) {
        const docRef = doc(db, 'usuarios', login);
        await updateDoc(docRef, {
          ativos: updatedAtivos,
        });
      }
    };

    atualizar();
    const intervalId = setInterval(atualizar, 60 * 1000); // 1 minuto = 1 dia
    return () => clearInterval(intervalId);
  }, [ativos, setAtivos, login]);
};

export default useAtualizarAtivos;
