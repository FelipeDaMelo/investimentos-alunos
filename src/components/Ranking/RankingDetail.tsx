// Caminho: src/components/Ranking/RankingDetail.tsx

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking, RankingParticipantData } from '../../types/Ranking';
import { UserPlus, Trash2, Trophy, ChevronRight } from 'lucide-react';
import AddParticipantsModal from './AddParticipantsModal';
import { motion } from 'framer-motion';
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';

interface Props {
  ranking: Ranking;
  login: string;
  onBack: () => void;
  onDelete: (rankingId: string) => void;
  onAddParticipants: (rankingId: string, newParticipants: string[]) => void;
  onRemoveParticipant: (rankingId: string, participantIdToRemove: string) => void;
}

export default function RankingDetail({ ranking, login, onBack, onDelete, onAddParticipants }: Props) {
  const [participantsData, setParticipantsData] = useState<Omit<RankingParticipantData, 'rentabilidadePorDia'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setParticipantsData([]);

    if (ranking.participantes.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes = ranking.participantes.map((participantId) => {
      const docRef = doc(db, "usuarios", participantId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const { rentabilidade } = calculateUserMetrics(data);

          const participantData = {
            nomeGrupo: participantId,
            fotoGrupo: data.fotoGrupo,
            rentabilidadeAtual: rentabilidade,
          };

          setParticipantsData(prevData => {
            const otherParticipants = prevData.filter(p => p.nomeGrupo !== participantId);
            const newData = [...otherParticipants, participantData];
            newData.sort((a, b) => b.rentabilidadeAtual - a.rentabilidadeAtual);
            return newData;
          });
        }
      });
    });

    const timer = setTimeout(() => setLoading(false), 1500);

    return () => {
      clearTimeout(timer);
      unsubscribes.forEach(unsub => unsub());
    };
  }, [ranking]);

  const formatRankingName = (name: string) => {
    return name.replace(/_/g, ' ').toUpperCase();
  };

  const topThree = participantsData.slice(0, 3);
  const restOfParticipants = participantsData.slice(3);

  return (
    <div className="w-full p-4 sm:p-6 lg:p-10 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-200 shrink-0">
            <Trophy size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
              {formatRankingName(ranking.nome)}
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Detalhes do Ranking</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowAddModal(true)} className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all" title="Adicionar Participantes">
            <UserPlus size={20} />
          </button>
          <button onClick={() => onDelete(ranking.id)} className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl transition-all" title="Excluir Ranking">
            <Trash2 size={20} />
          </button>
          <button onClick={onBack} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black tracking-tight hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3">
             Voltar ao Dashboard
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
           <div className="w-16 h-16 bg-slate-200 rounded-3xl" />
           <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Calculando desempenhos...</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="flex items-center gap-3 mb-10">
             <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Pódio Atual</h2>
          </div>
          
          <div className="flex items-end justify-center gap-6 mb-16">
            {/* PRATA */}
            <div className="w-1/3 max-w-[280px]">
              {topThree[1] && (
                <motion.div key={topThree[1].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className={`relative flex flex-col items-center p-8 rounded-[2.5rem] bg-gradient-to-b from-slate-100 to-white border-2 hover:-translate-y-2 transition-transform duration-500 h-[320px] justify-end ${topThree[1].nomeGrupo === login ? 'border-blue-500 shadow-2xl shadow-blue-100' : 'border-slate-300 shadow-xl shadow-slate-200/50'}`}>
                  {topThree[1].nomeGrupo === login && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg z-10">Você</span>
                  )}
                  <span className="absolute top-6 left-6 text-7xl font-black text-slate-300 opacity-100 z-0 select-none">2</span>
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <img src={topThree[1].fotoGrupo || '/logo-marista.png'} alt={topThree[1].nomeGrupo} className="w-24 h-24 rounded-[2rem] object-cover shadow-lg mb-4" />
                    <p className="font-black text-lg text-slate-800 text-center w-full truncate">{topThree[1].nomeGrupo}</p>
                    <div className={`font-black text-3xl tracking-tighter mt-2 ${topThree[1].rentabilidadeAtual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {topThree[1].rentabilidadeAtual >= 0 ? '+' : ''}{topThree[1].rentabilidadeAtual.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* OURO */}
            <div className="w-1/3 max-w-[320px]">
              {topThree[0] && (
                <motion.div key={topThree[0].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0 }} className={`relative flex flex-col items-center p-8 rounded-[3rem] bg-gradient-to-b from-amber-100/50 to-white border-2 hover:-translate-y-2 transition-transform duration-500 h-[380px] justify-end ${topThree[0].nomeGrupo === login ? 'border-blue-500 shadow-2xl shadow-blue-200' : 'border-amber-300 shadow-2xl shadow-amber-200/50'}`}>
                  {topThree[0].nomeGrupo === login && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg z-10">Você</span>
                  )}
                  <span className="absolute top-6 left-1/2 -translate-x-1/2 text-8xl font-black text-amber-300 opacity-100 z-0 select-none leading-none">1</span>
                  <Trophy className="absolute top-6 right-6 w-8 h-8 text-amber-500 drop-shadow-sm z-10" />
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <img src={topThree[0].fotoGrupo || '/logo-marista.png'} alt={topThree[0].nomeGrupo} className="w-32 h-32 rounded-[2.5rem] object-cover shadow-xl mb-4 border-4 border-white" />
                    <p className="font-black text-xl text-slate-800 text-center w-full truncate">{topThree[0].nomeGrupo}</p>
                    <div className={`font-black text-4xl tracking-tighter mt-2 ${topThree[0].rentabilidadeAtual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {topThree[0].rentabilidadeAtual >= 0 ? '+' : ''}{topThree[0].rentabilidadeAtual.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* BRONZE */}
            <div className="w-1/3 max-w-[280px]">
              {topThree[2] && (
                <motion.div key={topThree[2].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className={`relative flex flex-col items-center p-8 rounded-[2.5rem] bg-gradient-to-b from-orange-50 to-white border-2 hover:-translate-y-2 transition-transform duration-500 h-[300px] justify-end ${topThree[2].nomeGrupo === login ? 'border-blue-500 shadow-2xl shadow-blue-100' : 'border-orange-200 shadow-xl shadow-orange-100/50'}`}>
                  {topThree[2].nomeGrupo === login && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg z-10">Você</span>
                  )}
                  <span className="absolute top-6 right-6 text-7xl font-black text-orange-300 opacity-100 z-0 select-none">3</span>
                  <div className="relative z-10 flex flex-col items-center w-full">
                    <img src={topThree[2].fotoGrupo || '/logo-marista.png'} alt={topThree[2].nomeGrupo} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-md mb-4" />
                    <p className="font-black text-base text-slate-800 text-center w-full truncate">{topThree[2].nomeGrupo}</p>
                    <div className={`font-black text-2xl tracking-tighter mt-2 ${topThree[2].rentabilidadeAtual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {topThree[2].rentabilidadeAtual >= 0 ? '+' : ''}{topThree[2].rentabilidadeAtual.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          
          {restOfParticipants.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Outros Participantes</h2>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-500">{restOfParticipants.length}</span>
              </div>
              <div className="space-y-4">
                {restOfParticipants.map((p, index) => (
                  <motion.div 
                    key={p.nomeGrupo} 
                    layout 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.3, delay: (index) * 0.05 }} 
                    className={`group flex items-center justify-between p-6 bg-white border-2 shadow-sm rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${p.nomeGrupo === login ? 'border-blue-500 shadow-blue-100/50 hover:border-blue-500' : 'border-slate-100'}`}
                  >
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-black text-slate-200 w-12 text-center">{index + 4}</span>
                      <div className="relative">
                        <img src={p.fotoGrupo || '/logo-marista.png'} alt={p.nomeGrupo} className="w-16 h-16 rounded-[1.5rem] object-cover shadow-sm bg-slate-50" />
                        {p.nomeGrupo === login && (
                          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm">Você</span>
                        )}
                      </div>
                      <p className={`font-black text-xl tracking-tight truncate max-w-[200px] md:max-w-md ${p.nomeGrupo === login ? 'text-blue-600' : 'text-slate-800'}`}>{p.nomeGrupo}</p>
                    </div>
                    <div className={`font-black text-2xl tracking-tighter ${p.rentabilidadeAtual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {p.rentabilidadeAtual >= 0 ? '+' : ''}{p.rentabilidadeAtual.toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col animate-fade-in">
           <div className="bg-white w-full h-full flex flex-col overflow-hidden relative animate-slide-up">
             <AddParticipantsModal 
               currentParticipants={ranking.participantes}
               onClose={() => setShowAddModal(false)}
               onConfirm={(newParticipants) => {
                 onAddParticipants(ranking.id, newParticipants);
                 setShowAddModal(false);
               }}
             />
           </div>
        </div>
      )}
    </div>
  );
}