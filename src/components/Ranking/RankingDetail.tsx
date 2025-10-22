// Caminho: src/components/Ranking/RankingDetail.tsx

import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking, RankingParticipantData } from '../../types/Ranking';
import Button from '../Button';
import { UserPlus, Trash2, Trophy } from 'lucide-react';
import AddParticipantsModal from './AddParticipantsModal';
import { motion } from 'framer-motion';
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';

interface Props {
  ranking: Ranking;
  onBack: () => void;
  onDelete: (rankingId: string) => void;
  onAddParticipants: (rankingId: string, newParticipants: string[]) => void;
  onRemoveParticipant: (rankingId: string, participantIdToRemove: string) => void;
}

export default function RankingDetail({ ranking, onBack, onDelete, onAddParticipants }: Props) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 animate-fade-in">
        <header className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 rounded-2xl shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4 mb-6 md:mb-0">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
              <Trophy className="w-8 h-8 text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
                {formatRankingName(ranking.nome)}
              </h1>
              <p className="text-indigo-100 text-sm font-medium opacity-80">
                Quadro de Classificação
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddModal(true)} className="!bg-green-500 hover:!bg-green-600 text-white border-none shadow-md flex items-center gap-2 !py-2.5 !px-4" title="Adicionar participantes">
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
            <Button onClick={onBack} className="!bg-white !text-indigo-900 hover:!bg-gray-100 border-none shadow-md !py-2.5 !px-4 font-semibold">
              Voltar
            </Button>
            <Button onClick={() => onDelete(ranking.id)} className="!bg-red-500/80 hover:!bg-red-600 text-white border-none shadow-md !p-2.5" title="Excluir Ranking">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {loading ? (
          <p className="text-center text-gray-600 py-10">Calculando performance dos participantes...</p>
        ) : (
          <div className="w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Classificação Atual</h2>
            
            {/* ===== PÓDIO COM CORES VIBRANTES ===== */}
            <div className="flex items-end justify-center gap-4 sm:gap-6 px-2 sm:px-0 mb-10">
              {/* --- 2º LUGAR (PRATA) --- */}
              <div className="w-1/3">
                {topThree[1] && (
                  <motion.div key={topThree[1].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative flex flex-col items-center p-4 rounded-2xl bg-slate-200/70 backdrop-blur-md border border-slate-300/50 shadow-lg">
                    <span className="absolute -top-4 -right-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-slate-700 opacity-60">2</span>
                    <img src={topThree[1].fotoGrupo || '/logo-marista.png'} alt={topThree[1].nomeGrupo} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md" />
                    <p className="mt-3 font-bold text-base sm:text-lg text-slate-800 text-center w-full truncate">{topThree[1].nomeGrupo}</p>
                    <div className={`font-bold text-xl sm:text-2xl mt-1 ${topThree[1].rentabilidadeAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {topThree[1].rentabilidadeAtual >= 0 ? '▲' : '▼'} {Math.abs(topThree[1].rentabilidadeAtual).toFixed(2)}%
                    </div>
                  </motion.div>
                )}
              </div>
              {/* --- 1º LUGAR (OURO) --- */}
              <div className="w-1/3">
                {topThree[0] && (
                  <motion.div key={topThree[0].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0 }} className="relative flex flex-col items-center p-4 rounded-2xl bg-amber-300/70 backdrop-blur-md border border-amber-400/50 shadow-2xl min-h-[14rem] sm:min-h-[16rem]">
                    <Trophy className="w-10 h-10 text-amber-500 mb-2" />
                    <img src={topThree[0].fotoGrupo || '/logo-marista.png'} alt={topThree[0].nomeGrupo} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                    <p className="mt-3 font-bold text-lg sm:text-xl text-amber-900 text-center w-full truncate">{topThree[0].nomeGrupo}</p>
                    <div className={`font-bold text-2xl sm:text-3xl mt-1 ${topThree[0].rentabilidadeAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {topThree[0].rentabilidadeAtual >= 0 ? '▲' : '▼'} {Math.abs(topThree[0].rentabilidadeAtual).toFixed(2)}%
                    </div>
                  </motion.div>
                )}
              </div>
              {/* --- 3º LUGAR (BRONZE) --- */}
              <div className="w-1/3">
                {topThree[2] && (
                  <motion.div key={topThree[2].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative flex flex-col items-center p-4 rounded-2xl bg-orange-300/70 backdrop-blur-md border border-orange-400/50 shadow-lg">
                    <span className="absolute -top-4 -right-2 text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-600 to-orange-800 opacity-60">3</span>
                    <img src={topThree[2].fotoGrupo || '/logo-marista.png'} alt={topThree[2].nomeGrupo} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-md" />
                    <p className="mt-3 font-bold text-base sm:text-lg text-orange-900 text-center w-full truncate">{topThree[2].nomeGrupo}</p>
                    <div className={`font-bold text-xl sm:text-2xl mt-1 ${topThree[2].rentabilidadeAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {topThree[2].rentabilidadeAtual >= 0 ? '▲' : '▼'} {Math.abs(topThree[2].rentabilidadeAtual).toFixed(2)}%
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              {restOfParticipants.map((p, index) => (
                <motion.div key={p.nomeGrupo} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: (index) * 0.05 }} className="group flex items-center p-4 bg-white/70 backdrop-blur-md border border-white/50 shadow-md rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-blue-400 w-16 text-center">{index + 4}º</span>
                  <img src={p.fotoGrupo || '/logo-marista.png'} alt={p.nomeGrupo} className="w-14 h-14 rounded-full mx-4 object-cover border-2 border-white" />
                  <p className="flex-grow font-semibold text-gray-800 text-lg sm:text-xl truncate">{p.nomeGrupo}</p>
                  <div className={`font-bold text-gray-800 text-xl sm:text-2xl ${p.rentabilidadeAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {p.rentabilidadeAtual >= 0 ? `▲ ${p.rentabilidadeAtual.toFixed(2)}%` : `▼ ${Math.abs(p.rentabilidadeAtual).toFixed(2)}%`}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {showAddModal && (
          <AddParticipantsModal onClose={() => setShowAddModal(false)} currentParticipants={ranking.participantes} onConfirm={(newParticipants) => { onAddParticipants(ranking.id, newParticipants); setShowAddModal(false); }} />
        )}
      </div>
    </div>
  );
}