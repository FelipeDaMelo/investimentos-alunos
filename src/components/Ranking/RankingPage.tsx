// Caminho: src/components/Ranking/RankingPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking } from '../../types/Ranking';
import Button from '../Button';
import CreateRankingModal from './CreateRankingModal';
import RankingDetail from './RankingDetail';
import { Trophy, Users } from 'lucide-react';

const ADMIN_PASSWORD = "admin"; // Mude para a senha que você desejar

interface RankingPageProps {
  onBack: () => void;
}

export default function RankingPage({ onBack }: RankingPageProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<Ranking | null>(null);

const fetchRankings = async () => {
    setLoading(true);
    // ✅ A ordenação por dataCriacao continuará funcionando. Documentos sem o campo serão listados por último.
    const rankingsQuery = query(collection(db, "rankings"), orderBy("dataCriacao", "desc"));
    const querySnapshot = await getDocs(rankingsQuery);
    const fetchedRankings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            nome: data.nome,
            participantes: data.participantes,
            // ✅ Adiciona uma verificação: se o campo existe, converte. Se não, fica undefined.
            dataCriacao: data.dataCriacao ? data.dataCriacao.toDate() : undefined,
        } as Ranking;
    });
    setRankings(fetchedRankings);
    setLoading(false);
};


  useEffect(() => {
    fetchRankings();
  }, []);

  const handleCreateClick = () => {
    const password = prompt("Para criar um novo ranking, por favor, insira a senha de administrador:");
    if (password === ADMIN_PASSWORD) {
      setShowCreateModal(true);
    } else if (password !== null) {
      alert("Senha incorreta!");
    }
  };

  const handleDeleteRanking = async (rankingId: string) => {
    const password = prompt("Para excluir este ranking, por favor, insira a senha de administrador:");
    if (password !== ADMIN_PASSWORD) {
      if (password !== null) alert("Senha incorreta!");
      return;
    }

    if (confirm("Você tem certeza que deseja excluir este ranking permanentemente?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "rankings", rankingId));
        setRankings(prev => prev.filter(r => r.id !== rankingId));
        setSelectedRanking(null);
        alert("Ranking excluído com sucesso.");
      } catch (error) {
        console.error("Erro ao excluir ranking:", error);
        alert("Não foi possível excluir o ranking.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddParticipants = async (rankingId: string, newParticipants: string[]) => {
    const password = prompt("Para adicionar participantes, por favor, insira a senha de administrador:");
    if (password !== ADMIN_PASSWORD) {
        if (password !== null) alert("Senha incorreta!");
        return;
    }

    setLoading(true);
    try {
        const rankingRef = doc(db, "rankings", rankingId);
        await updateDoc(rankingRef, {
            participantes: arrayUnion(...newParticipants)
        });

        setSelectedRanking(prev => {
            if (!prev) return null;
            return {
                ...prev,
                participantes: [...new Set([...prev.participantes, ...newParticipants])]
            };
        });
        
        alert(`${newParticipants.length} participante(s) adicionado(s) com sucesso!`);

    } catch (error) {
        console.error("Erro ao adicionar participantes:", error);
        alert("Não foi possível adicionar os participantes.");
    } finally {
        setLoading(false);
    }
  };

  // ✅ FUNÇÃO MOVIDA PARA O LUGAR CORRETO
  const handleRemoveParticipant = async (rankingId: string, participantIdToRemove: string) => {
    const password = prompt("Para remover este participante, por favor, insira a senha de administrador:");
    if (password !== ADMIN_PASSWORD) {
        if (password !== null) alert("Senha incorreta!");
        return;
    }

    if (confirm(`Você tem certeza que deseja remover "${participantIdToRemove}" deste ranking?`)) {
        setLoading(true);
         try {
            const rankingRef = doc(db, "rankings", rankingId);
            await updateDoc(rankingRef, {
                participantes: arrayRemove(participantIdToRemove)
            });

            // ✅ ATUALIZAÇÃO DA LÓGICA
            // Atualiza o estado de 'rankings' na página principal.
            // Isso força o 'selectedRanking' a ser recriado a partir de uma fonte limpa.
            setRankings(prevRankings => 
                prevRankings.map(r => 
                    r.id === rankingId 
                    ? { ...r, participantes: r.participantes.filter(p => p !== participantIdToRemove) } 
                    : r
                )
            );
            
            // Força a atualização do 'selectedRanking' com base na nova lista de 'rankings'
            setSelectedRanking(prev => {
                if (!prev) return null;
                const updatedParticipants = prev.participantes.filter(p => p !== participantIdToRemove);
                return { ...prev, participantes: updatedParticipants };
            });
            
            alert(`"${participantIdToRemove}" foi removido do ranking com sucesso!`);

        } catch (error) {
            console.error("Erro ao remover participante:", error);
            alert("Não foi possível remover o participante.");
        } finally {
            setLoading(false);
        }
    }
  };

   if (selectedRanking) {
    return (
      <RankingDetail 
        ranking={selectedRanking} 
        onBack={() => setSelectedRanking(null)}
        onDelete={handleDeleteRanking}
        onAddParticipants={handleAddParticipants}
        onRemoveParticipant={handleRemoveParticipant}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Rankings de Performance</h1>
        </div>
        <div className="flex gap-4 mt-4 sm:mt-0">
            <Button onClick={handleCreateClick}>Criar Novo Ranking</Button>
            <Button onClick={onBack} variant="secondary">Voltar ao Painel</Button>
        </div>
      </header>

      {loading ? (
        <p className="text-center text-gray-600">Carregando rankings...</p>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Rankings Disponíveis</h2>
          {rankings.length > 0 ? (
            rankings.map(ranking => (
              <div
                key={ranking.id}
                onClick={() => setSelectedRanking(ranking)}
                className="p-5 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-marista-blue transition-all group"
              >
                <h3 className="text-xl font-semibold text-marista-blue group-hover:text-marista-dark">{ranking.nome}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                    <Users size={16} />
                    <span>{ranking.participantes.length} participantes</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg">
                <p className="font-medium">Nenhum ranking foi criado ainda.</p>
                <p className="text-sm mt-2">Clique em "Criar Novo Ranking" para começar.</p>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateRankingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRankings();
          }}
        />
      )}
    </div>
  );
}