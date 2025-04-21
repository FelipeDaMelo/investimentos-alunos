import { useEffect } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ativo } from '../types/Ativo';

const useAtualizarHistorico = (grupoId: string, ativos: Ativo[]) => {
  useEffect(() => {
    const atualizar = async () => {
      if (ativos.length === 0) return;
      
      const hoje = new Date().toISOString().split('T')[0];
      const valorTotal = ativos.reduce((sum, ativo) => sum + (ativo.valorAtual || 0), 0);
      
      const detalhesAtivos = ativos.reduce((acc, ativo) => {
        acc[ativo.id] = ativo.valorAtual || 0;
        return acc;
      }, {} as Record<string, number>);

      try {
        const docRef = doc(db, 'gruposInvestimento', grupoId);
        await updateDoc(docRef, {
          historicoPatrimonio: arrayUnion({
            data: hoje,
            valorTotal,
            detalhesAtivos
          })
        });
      } catch (error) {
        console.error('Erro ao atualizar histórico:', error);
      }
    };

    // Executa imediatamente e depois a cada 24 horas
    atualizar();
    const intervalId = setInterval(atualizar, 86400000);

    return () => clearInterval(intervalId);
  }, [grupoId, ativos]);
};

export default useAtualizarHistorico;