import { useEffect, useRef } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoFixa from './calcularRendimentoFixa';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
      if (ativosRef.current.length === 0) return;

      const agora = new Date();
      const agoraBrasilia = new Date(agora.getTime() - 3 * 60 * 60 * 1000); // UTC-3 
      
      const hoje = agoraBrasilia.toISOString().split('T')[0];

      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
const ultimaData = docSnap.data()?.ultimaAtualizacao || hoje;
const t = Math.floor(
  (new Date(hoje).getTime() - new Date(ultimaData).getTime()) / (1000 * 60 * 60 * 24)
);
const ultimaHoraStr = docSnap.data()?.ultimaHoraAtualizacao ?? '00:00';
const agoraMs = agoraBrasilia.getTime();
const ultimaHoraMs = new Date(`${hoje}T${ultimaHoraStr}`).getTime();

if (agoraMs - ultimaHoraMs < 30 * 60 * 1000) return; // menos de 30 minutos

      const ativosAtualizados = await Promise.all(
        ativosRef.current.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const rendimento = await calcularRendimentoFixa(ativo as RendaFixaAtivo);
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
            const valorAtual = parseFloat(valorAtualString) || 0; // <- proteção contra NaN
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

      // 🧾 Salva ativos atualizados e marca a data da atualização
      try {
        await updateDoc(docRef, {
  ativos: ativosAtualizados,
  ultimaAtualizacao: hoje,
  ultimaHoraAtualizacao: agoraBrasilia.getHours().toString().padStart(2, '0') + ':' + agoraBrasilia.getMinutes().toString().padStart(2, '0')
});
        atualizarCallback(ativosAtualizados); // atualiza o estado local (gráfico, cards, etc.)
      } catch (error) {
        console.error('Erro ao salvar patrimônio atualizado no Firebase:', error);
      }
    };

    verificarEAtualizar();
  }, [atualizarCallback, login]);
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
