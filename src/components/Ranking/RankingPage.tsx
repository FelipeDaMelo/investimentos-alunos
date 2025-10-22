// Caminho: src/components/Ranking/RankingPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking } from '../../types/Ranking';
import Button from '../Button';
import CreateRankingModal from './CreateRankingModal';
import RankingDetail from './RankingDetail';
import { Trophy, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
    const rankingsQuery = query(collection(db, "rankings"), orderBy("dataCriacao", "desc"));
    const querySnapshot = await getDocs(rankingsQuery);
    const fetchedRankings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            nome: data.nome,
            participantes: data.participantes,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* ===== CABEÇALHO COM HIERARQUIA INVERTIDA ===== */}
        <header className="bg-white/70 backdrop-blur-md border border-white/50 shadow-lg rounded-2xl p-6 mb-10 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-full shadow-md shrink-0">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              {/* --- HIERARQUIA DE TÍTULO ATUALIZADA --- */}
              <div>
                <p className="text-lg font-semibold text-gray-600">Painel de Classificação</p>
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-none">
                    <span>Simul</span>
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 bg-[length:200%_auto] animate-text-shine animate-text-pulse">AÇÃO</span>
                </h1>
              </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3 w-full lg:w-auto shrink-0">
              <Button onClick={handleCreateClick} className="!bg-blue-600 hover:!bg-blue-700 !shadow-lg flex-grow sm:flex-grow-0">Criar Novo Ranking</Button>
              <Button onClick={onBack} variant="secondary" className="!bg-white/80 hover:!bg-white flex-grow sm:flex-grow-0">Voltar ao Painel</Button>
          </div>
        </header>

        {loading ? (
          <p className="text-center text-gray-600">Carregando rankings...</p>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 px-2">Rankings Disponíveis</h2>
            {rankings.length > 0 ? (
              rankings.map((ranking, index) => (
                <motion.div
                  key={ranking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setSelectedRanking(ranking)}
                  className="group flex items-center justify-between p-6 bg-white/70 backdrop-blur-md border border-white/50 shadow-md rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-300"
                >
                  <div>
                    <h3 className="text-xl font-semibold text-blue-800 transition-colors group-hover:text-blue-600">{ranking.nome}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <Users size={16} />
                        <span>{ranking.participantes.length} participantes</span>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                </motion.div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-12 bg-white/60 backdrop-blur-md border-2 border-dashed rounded-2xl">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="font-medium text-lg">Nenhum ranking foi criado ainda.</p>
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
    </div>
  );
}