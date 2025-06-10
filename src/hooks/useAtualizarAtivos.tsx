// Caminho provável: src/hooks/useAtualizarAtivos.tsx

import { useEffect, useRef } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoFixa from './calcularRendimentoFixa';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { diasDecorridos } from '../utils/datas';

type AtualizarAtivosCallback = (ativosAtualizados: Ativo[]) => void;

const useAtualizarAtivos = (
  ativos: Ativo[],
  atualizarCallback: AtualizarAtivosCallback,
  login: string
) => {
  const ativosRef = useRef<Ativo[]>(ativos);

  useEffect(() => {
    ativosRef.current = ativos;
  }, [ativos]);

  useEffect(() => {
    const verificarEAtualizar = async () => {
      // Não roda se não houver ativos para atualizar
      if (!ativosRef.current || ativosRef.current.length === 0) {
        return;
      }

      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const ultimaDataAtualizacao = docSnap.data().ultimaAtualizacao;
      const hoje = new Date().toISOString().split('T')[0];

      // Se não houver data de atualização (primeira vez), ou se já foi atualizado hoje, não faz nada.
      // O primeiro rendimento é calculado pela ATUALIZAÇÃO MANUAL.
      if (!ultimaDataAtualizacao || ultimaDataAtualizacao >= hoje) {
        return;
      }

      // Calcula os dias úteis entre a última atualização salva e hoje
      const diasParaRender = diasDecorridos(ultimaDataAtualizacao, hoje);
      
      // Se não houver dias úteis para renderizar (ex: fim de semana), não continua.
      if (diasParaRender <= 0) {
        return;
      }

      const ativosAtualizados = await Promise.all(
        ativosRef.current.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            // Passa o número de dias corretos para a função de cálculo
            const novoValor = await calcularRendimentoFixa(ativo as RendaFixaAtivo, diasParaRender);
            return {
              ...ativo,
              valorAtual: novoValor,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: novoValor,
              },
            };
          } else { // Renda Variável continua buscando o preço atual de mercado
            const ativoVar = ativo as RendaVariavelAtivo;
            try {
              const valorAtualString = await fetchValorAtual(ativoVar.tickerFormatado);
              const valorAtual = parseFloat(valorAtualString);
              const patrimonio = valorAtual * ativoVar.quantidade;
              return {
                ...ativo,
                valorAtual,
                patrimonioPorDia: { ...ativo.patrimonioPorDia, [hoje]: patrimonio },
              };
            } catch (error) {
              console.warn(`Não foi possível atualizar ${ativoVar.tickerFormatado}. Mantendo valor anterior.`, error);
              return ativo; // Em caso de erro, retorna o ativo sem alteração
            }
          }
        })
      );
      
      try {
        await updateDoc(docRef, {
          ativos: ativosAtualizados,
          ultimaAtualizacao: hoje, // Marca hoje como a nova data da última atualização
        });
        atualizarCallback(ativosAtualizados);
      } catch (error) {
        console.error('Erro ao salvar patrimônio atualizado no Firebase:', error);
      }
    };

    // Define um timeout para rodar a verificação um pouco depois do app carregar,
    // para não competir com o carregamento inicial de dados.
    const timer = setTimeout(verificarEAtualizar, 5000); // 5 segundos de delay

    // Limpa o timeout se o componente for desmontado
    return () => clearTimeout(timer);

  }, [login]); // Depende apenas do login para rodar uma vez por sessão
};

export async function salvarUltimaAtualizacaoManual(usuarioId: string) {
  const ref = doc(db, 'usuarios', usuarioId);
  await updateDoc(ref, {
    ultimaAtualizacaoManual: new Date().toISOString()
  });
}

export async function obterUltimaAtualizacaoManual(usuarioId: string): Promise<Date | null> {
  const ref = doc(db, 'usuarios', usuarioId);
  const docSnap = await getDoc(ref);
  if (docSnap.exists() && docSnap.data().ultimaAtualizacaoManual) {
    return new Date(docSnap.data().ultimaAtualizacaoManual);
  }
  return null;
}

export default useAtualizarAtivos;