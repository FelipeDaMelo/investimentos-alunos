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
      const horarioAtual = agora.getHours();
      const hoje = agora.toISOString().split('T')[0];

      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      const ultimaAtualizacao = docSnap.data()?.ultimaAtualizacao || '';
      const ultimaData = ultimaAtualizacao || hoje;
const t = Math.max(
  1,
  Math.floor(
    (new Date(hoje).getTime() - new Date(ultimaData).getTime()) /
    (1000 * 60 * 60 * 24)
  )
);

      // ⚠️ Se já atualizou hoje ou ainda não passou das 12h, não faz nada
      const ultimaHora = docSnap.data()?.ultimaHoraAtualizacao || 0;
const agoraMs = agora.getTime();
const ultimaHoraMs = new Date(`${hoje}T${ultimaHora}:00`).getTime();

if (agoraMs - ultimaHoraMs < 30 * 60 * 1000) return; // menos de 30 minutos

      const ativosAtualizados = await Promise.all(
        ativosRef.current.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const rendimento = await calcularRendimentoFixa(ativo as RendaFixaAtivo, t);
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

      // 🧾 Salva ativos atualizados e marca a data da atualização
      try {
        await updateDoc(docRef, {
  ativos: ativosAtualizados,
  ultimaAtualizacao: hoje,
  ultimaHoraAtualizacao: agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0')
});
        atualizarCallback(ativosAtualizados); // atualiza o estado local (gráfico, cards, etc.)
      } catch (error) {
        console.error('Erro ao salvar patrimônio atualizado no Firebase:', error);
      }
    };

    verificarEAtualizar();
  }, [atualizarCallback, login]);
};

export default useAtualizarAtivos;
