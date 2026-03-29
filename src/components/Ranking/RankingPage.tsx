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
import Sidebar from '../Sidebar';
import AdminPasswordModal from './AdminPasswordModal';

const ADMIN_PASSWORD = "admin"; // Mude para a senha que você desejar

interface RankingPageProps {
  onBack: () => void;
  login?: string;
  fotoGrupo?: string | null;
  onLogout?: () => void;
  onUploadConfirmado?: (file: File, senhaDigitada: string) => Promise<void>;
}

export default function RankingPage({
  onBack,
  login,
  fotoGrupo,
  onLogout,
  onUploadConfirmado
}: RankingPageProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<Ranking | null>(null);
  const [passwordAction, setPasswordAction] = useState<{ title: string, onConfirm: (pwd: string) => void } | null>(null);

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
    setPasswordAction({
      title: "Criar Novo Ranking",
      onConfirm: (password) => {
        if (password === ADMIN_PASSWORD) {
          setShowCreateModal(true);
        } else {
          alert("Senha incorreta!");
        }
      }
    });
  };

  const handleDeleteRanking = (rankingId: string) => {
    setPasswordAction({
      title: "Excluir Ranking",
      onConfirm: async (password) => {
        if (password !== ADMIN_PASSWORD) {
          alert("Senha incorreta!");
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
      }
    });
  };

  const handleAddParticipants = (rankingId: string, newParticipants: string[]) => {
    setPasswordAction({
      title: "Adicionar Participantes",
      onConfirm: async (password) => {
        if (password !== ADMIN_PASSWORD) {
          alert("Senha incorreta!");
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
      }
    });
  };

  const handleRemoveParticipant = (rankingId: string, participantIdToRemove: string) => {
    setPasswordAction({
      title: "Remover Participante",
      onConfirm: async (password) => {
        if (password !== ADMIN_PASSWORD) {
          alert("Senha incorreta!");
          return;
        }

        if (confirm(`Você tem certeza que deseja remover "${participantIdToRemove}" deste ranking?`)) {
          setLoading(true);
          try {
            const rankingRef = doc(db, "rankings", rankingId);
            await updateDoc(rankingRef, {
              participantes: arrayRemove(participantIdToRemove)
            });

            setRankings(prevRankings =>
              prevRankings.map(r =>
                r.id === rankingId
                  ? { ...r, participantes: r.participantes.filter(p => p !== participantIdToRemove) }
                  : r
              )
            );

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
      }
    });
  };

  if (selectedRanking) {
    return (
      <div className="flex h-screen bg-slate-50/30 overflow-hidden">
        <Sidebar
          login={login || ''}
          fotoGrupo={fotoGrupo || null}
          onLogout={onLogout || (() => { })}
          onUploadConfirmado={onUploadConfirmado || (async () => { })}
          onTriggerDelete={() => { }}
        />
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
          <RankingDetail
            ranking={selectedRanking}
            login={login || ''}
            onBack={() => setSelectedRanking(null)}
            onDelete={handleDeleteRanking}
            onAddParticipants={handleAddParticipants}
            onRemoveParticipant={handleRemoveParticipant}
          />
        </main>
        
        {passwordAction && (
          <AdminPasswordModal 
            title={passwordAction.title}
            onClose={() => setPasswordAction(null)}
            onConfirm={(senha) => {
              passwordAction.onConfirm(senha);
              setPasswordAction(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/30 overflow-hidden">
      <Sidebar
        login={login || ''}
        fotoGrupo={fotoGrupo || null}
        onLogout={onLogout || (() => { })}
        onUploadConfirmado={onUploadConfirmado || (async () => { })}
        onTriggerDelete={() => { }}
      />
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="w-full p-4 pb-28 md:pb-10 sm:p-6 lg:p-10 animate-fade-in">

          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 shrink-0">
                <Trophy size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
                  Rankings
                </h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Ambiente de Gamificação</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleCreateClick} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 flex items-center gap-3">
                <Trophy size={20} />
                Criar Novo Ranking
              </button>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
              <div className="w-16 h-16 bg-slate-200 rounded-3xl" />
              <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Carregando rankings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Rankings Disponíveis</h2>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-500">{rankings.length}</span>
              </div>

              {rankings.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {rankings.map((ranking, index) => (
                    <motion.div
                      key={ranking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={() => setSelectedRanking(ranking)}
                      className="group bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex flex-col items-start space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{ranking.nome}</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Users size={14} />
                            <span>{ranking.participantes.length} participantes</span>
                          </div>
                          {login && ranking.participantes.includes(login) && (
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                              Você está participando
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {login && ranking.participantes.includes(login) && (
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform hidden sm:flex">
                            <Trophy size={20} />
                          </div>
                        )}
                        <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors border-2 border-transparent group-hover:border-blue-100">
                          <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                    <Trophy size={40} />
                  </div>
                  <p className="font-black text-xl text-slate-800 tracking-tight">Nenhum ranking criado</p>
                  <p className="text-sm font-bold text-slate-400">Clique em "Criar Novo Ranking" para começar a competição.</p>
                </div>
              )}
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col animate-fade-in">
              <div className="bg-white w-full h-full flex flex-col overflow-hidden relative animate-slide-up">
                <CreateRankingModal
                  onClose={() => setShowCreateModal(false)}
                  onSuccess={() => {
                    setShowCreateModal(false);
                    fetchRankings();
                  }}
                />
              </div>
            </div>
          )}
          
          {passwordAction && (
            <AdminPasswordModal 
              title={passwordAction.title}
              onClose={() => setPasswordAction(null)}
              onConfirm={(senha) => {
                passwordAction.onConfirm(senha);
                setPasswordAction(null);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}