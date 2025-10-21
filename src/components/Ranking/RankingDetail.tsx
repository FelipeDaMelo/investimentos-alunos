// Caminho: src/components/Ranking/RankingDetail.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react'; // ✅ 'useRef' adicionado
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking, RankingParticipantData } from '../../types/Ranking';
import Button from '../Button';
import { UserPlus, Trash2, X, Trophy, RefreshCw, Download } from 'lucide-react';
import AddParticipantsModal from './AddParticipantsModal';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Chart,
} from 'chart.js';
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
Chart.register(zoomPlugin);

const CORES_GRAFICO = [
  '#2E86AB', '#F18F01', '#73BA9B', '#D95D39', '#587B7F',
  '#1B4965', '#3A7CA5', '#4A6FA5', '#166088', '#5E3023',
  '#895737', '#B88B4A', '#D8C99B', '#D8973C', '#BD632F',
  '#A846A0', '#5C6F68', '#8AA29E', '#6E7DAB', '#00BBF9'
];

interface Props {
  ranking: Ranking;
  onBack: () => void;
  onDelete: (rankingId: string) => void;
  onAddParticipants: (rankingId: string, newParticipants: string[]) => void;
  onRemoveParticipant: (rankingId: string, participantIdToRemove: string) => void;
}

export default function RankingDetail({ ranking, onBack, onDelete, onAddParticipants, onRemoveParticipant }: Props) {
  const [participantsData, setParticipantsData] = useState<RankingParticipantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [escalaY, setEscalaY] = useState<'linear' | 'logarithmic'>('linear');
  const chartRef = useRef<Chart<'line'> | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribes: (() => void)[] = [];
    setParticipantsData([]); 

    ranking.participantes.forEach((participantId) => {
      const docRef = doc(db, "usuarios", participantId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const { rentabilidade } = calculateUserMetrics(data);

          const participantData: RankingParticipantData = {
            nomeGrupo: participantId,
            fotoGrupo: data.fotoGrupo,
            rentabilidadeAtual: rentabilidade,
            rentabilidadePorDia: calcularROIPorDia(data),
          };

          setParticipantsData(prevData => {
            const otherParticipants = prevData.filter(p => p.nomeGrupo !== participantId);
            const newData = [...otherParticipants, participantData];
            newData.sort((a, b) => b.rentabilidadeAtual - a.rentabilidadeAtual);
            return newData;
          });
        }
      });
      unsubscribes.push(unsubscribe);
    });
    
    setLoading(false);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [ranking]);

  const calcularROIPorDia = (userData: any): Record<string, number> => {
    const historico = userData.historico || [];
    const patrimonioPorDia = userData.patrimonioPorDia || {};
    const datas = Object.keys(patrimonioPorDia).sort();
    const roiPorDia: Record<string, number> = {};
    let totalAportadoAcumulado = 0;
    const aportesPorDia: Record<string, number> = {};

    historico
      .filter((reg: any) => reg.tipo === 'deposito')
      .forEach((reg: any) => {
        const dataDeposito = reg.data.split('T')[0];
        aportesPorDia[dataDeposito] = (aportesPorDia[dataDeposito] || 0) + reg.valor;
      });

    datas.forEach(data => {
      totalAportadoAcumulado += aportesPorDia[data] || 0;
      if (totalAportadoAcumulado > 0) {
        const patrimonioNesseDia = patrimonioPorDia[data];
        const ganhoReal = patrimonioNesseDia - totalAportadoAcumulado;
        roiPorDia[data] = (ganhoReal / totalAportadoAcumulado) * 100;
      } else {
        roiPorDia[data] = 0;
      }
    });
    return roiPorDia;
  };

  const chartData = useMemo(() => {
    let dataDeCorte = '1970-01-01';
    if (ranking.dataCriacao) {
      dataDeCorte = ranking.dataCriacao.toISOString().split('T')[0];
    } else {
      const allHistoricDates = [...new Set(participantsData.flatMap(p => Object.keys(p.rentabilidadePorDia)))].sort();
      if (allHistoricDates.length > 0) {
        dataDeCorte = allHistoricDates[0];
      }
    }
    let allDates = [...new Set(participantsData.flatMap(p => Object.keys(p.rentabilidadePorDia)))].sort();
    allDates = allDates.filter(date => date >= dataDeCorte);
    return {
      labels: allDates.map(date => {
        const [ano, mes, dia] = date.split('-');
        return `${dia}/${mes}/${ano.slice(2)}`;
      }),
      datasets: participantsData.map((p, index) => ({
        label: p.nomeGrupo,
        data: allDates.map(date => p.rentabilidadePorDia[date]),
        borderColor: CORES_GRAFICO[index % CORES_GRAFICO.length],
        backgroundColor: CORES_GRAFICO[index % CORES_GRAFICO.length] + '33',
        tension: 0.1,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
      })),
    };
  }, [participantsData, ranking.dataCriacao]);

  const formatRankingName = (name: string) => {
    return name.replace(/_/g, ' ').toUpperCase();
  };

  const topThree = participantsData.slice(0, 3);
  const restOfParticipants = participantsData.slice(3);

  return (
    <div className="max-w-7xl mx-auto p-4 animate-fade-in">
      <header className="bg-gradient-to-r from-indigo-700 to-blue-600 p-6 rounded-2xl shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center lg:text-left">Classificação Atual</h2>
            
            <div className="flex items-end justify-center gap-2 sm:gap-4 px-2 sm:px-0 mb-8">
              <div className="w-1/3">
                {topThree[1] && (
                  <motion.div key={topThree[1].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative flex flex-col items-center p-3 rounded-t-lg bg-gray-100 border-b-8 border-gray-300 shadow-md">
                    <span className="absolute -top-3 -right-2 text-3xl font-bold text-gray-400 opacity-50">2</span>
                    <img src={topThree[1].fotoGrupo || '/logo-marista.png'} alt={topThree[1].nomeGrupo} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md" />
                    <p className="mt-2 font-bold text-sm sm:text-base text-gray-800 text-center w-full">{topThree[1].nomeGrupo}</p>
                    <div className="font-bold text-lg sm:text-xl mt-1 text-green-600">▲ {topThree[1].rentabilidadeAtual.toFixed(2)}%</div>
                  </motion.div>
                )}
              </div>
              <div className="w-1/3">
                {topThree[0] && (
                  <motion.div key={topThree[0].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0 }} className="relative flex flex-col items-center p-3 rounded-t-lg bg-yellow-50 border-b-8 border-yellow-400 shadow-lg min-h-[12rem] sm:min-h-[14rem]">
                    <Trophy className="w-8 h-8 text-yellow-500 mb-1" />
                    <img src={topThree[0].fotoGrupo || '/logo-marista.png'} alt={topThree[0].nomeGrupo} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                    <p className="mt-2 font-bold text-base sm:text-lg text-gray-900 text-center w-full">{topThree[0].nomeGrupo}</p>
                    <div className="font-bold text-xl sm:text-2xl mt-1 text-green-600">▲ {topThree[0].rentabilidadeAtual.toFixed(2)}%</div>
                  </motion.div>
                )}
              </div>
              <div className="w-1/3">
                {topThree[2] && (
                  <motion.div key={topThree[2].nomeGrupo} layout initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="relative flex flex-col items-center p-3 rounded-t-lg bg-orange-50 border-b-8 border-orange-500 shadow-md">
                    <span className="absolute -top-3 -right-2 text-3xl font-bold text-orange-400 opacity-50">3</span>
                    <img src={topThree[2].fotoGrupo || '/logo-marista.png'} alt={topThree[2].nomeGrupo} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md" />
                    <p className="mt-2 font-bold text-sm sm:text-base text-gray-800 text-center w-full">{topThree[2].nomeGrupo}</p>
                    <div className="font-bold text-lg sm:text-xl mt-1 text-green-600">▲ {topThree[2].rentabilidadeAtual.toFixed(2)}%</div>
                  </motion.div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {restOfParticipants.map((p, index) => (
                <motion.div key={p.nomeGrupo} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: (index + 3) * 0.05 }} className="flex items-center p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50">
                  <span className="text-lg font-bold text-gray-400 w-12 text-center">{index + 4}º</span>
                  <img src={p.fotoGrupo || '/logo-marista.png'} alt={p.nomeGrupo} className="w-10 h-10 rounded-full mx-3 object-cover" />
                  <p className="flex-grow font-semibold text-gray-700 truncate">{p.nomeGrupo}</p>
                  <div className="font-semibold text-gray-800 text-lg">
                    {p.rentabilidadeAtual >= 0 ? <span className="text-green-600">▲ {p.rentabilidadeAtual.toFixed(2)}%</span> : <span className="text-red-600">▼ {Math.abs(p.rentabilidadeAtual).toFixed(2)}%</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-700 text-center">Evolução da Rentabilidade</h2>
              <select value={escalaY} onChange={(e) => setEscalaY(e.target.value as 'linear' | 'logarithmic')} className="bg-gray-100 border-2 border-gray-200 rounded-lg px-4 py-2 font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="linear">Escala Linear</option>
                <option value="logarithmic">Escala Logarítmica</option>
              </select>
            </div>
            <div className="h-[600px] w-full">
              {chartData.labels && chartData.labels.length > 0 ? (
                <Line ref={chartRef} data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { zoom: { pan: { enabled: true, mode: 'xy' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' } }, legend: { position: 'bottom' as const, labels: { padding: 20, usePointStyle: true, pointStyle: 'circle' } }, tooltip: { mode: 'index', intersect: false, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)}%` } } }, scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 20 } }, y: { type: escalaY, ticks: { callback: (value) => `${Number(value).toFixed(2)}%` } } }, interaction: { mode: 'nearest', axis: 'x', intersect: false } }} />
              ) : (
                <div className="h-full flex items-center justify-center text-center text-gray-500 p-4">
                  <p>Sem dados suficientes para exibir o gráfico de evolução.</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="secondary" onClick={() => chartRef.current?.resetZoom()} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Resetar Zoom
              </Button>
              <Button variant="primary" onClick={() => { const canvas = chartRef.current?.canvas; if (canvas) { const link = document.createElement('a'); link.download = `grafico_ranking_${ranking.nome.replace(/\s+/g, '_')}.png`; link.href = canvas.toDataURL('image/png'); link.click(); } }} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Baixar Gráfico
              </Button>
            </div>
          </div>
        </div>
      )}
      {showAddModal && (
        <AddParticipantsModal onClose={() => setShowAddModal(false)} currentParticipants={ranking.participantes} onConfirm={(newParticipants) => { onAddParticipants(ranking.id, newParticipants); setShowAddModal(false); }} />
      )}
    </div>
  );
}