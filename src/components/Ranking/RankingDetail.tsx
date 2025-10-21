// Caminho: src/components/Ranking/RankingDetail.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking, RankingParticipantData } from '../../types/Ranking';
import Button from '../Button';
import { UserPlus, Trash2, X } from 'lucide-react';
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
} from 'chart.js';
// ✅ Importa a nossa função de cálculo de ROI unificada
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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

  useEffect(() => {
    setLoading(true);
    const unsubscribes: (() => void)[] = [];
    setParticipantsData([]); 

    ranking.participantes.forEach((participantId) => {
      const docRef = doc(db, "usuarios", participantId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // ✅ A GRANDE MUDANÇA ESTÁ AQUI:
          // Em vez de calcular por cotas, usamos a função ROI unificada.
          const { rentabilidade } = calculateUserMetrics(data);

          const participantData: RankingParticipantData = {
            nomeGrupo: participantId,
            fotoGrupo: data.fotoGrupo,
            rentabilidadeAtual: rentabilidade, // Usa a rentabilidade ROI
            // ✅ Para o gráfico, vamos recalcular o ROI para cada dia (lógica mais complexa, mas correta)
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

  // ✅ NOVA FUNÇÃO AUXILIAR: Calcula o ROI para cada dia do histórico
  const calcularROIPorDia = (userData: any): Record<string, number> => {
    const historico = userData.historico || [];
    const patrimonioPorDia = userData.patrimonioPorDia || {};
    const datas = Object.keys(patrimonioPorDia).sort();
    const roiPorDia: Record<string, number> = {};

    let totalAportadoAcumulado = 0;
    
    // Calcula o aporte acumulado até cada data
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

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{formatRankingName(ranking.nome)}</h1>
        <div className="flex gap-4">
          <Button 
            onClick={() => setShowAddModal(true)} 
            variant="primary"
            title="Adicionar novos participantes a este ranking"
            className="bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="w-5 h-5" />
          </Button>
          <Button onClick={onBack} variant="secondary">Voltar</Button>
          <Button 
            onClick={() => onDelete(ranking.id)} 
            variant="danger"
            title="Excluir este ranking"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </header>
        {loading ? (
            <p className="text-center text-gray-600">Calculando performance dos participantes...</p>
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Classificação Atual</h2>
                    {participantsData.map((p, index) => (
                    // ✅ Envolva o card do participante com o motion.div para animar
                    <motion.div
                      key={p.nomeGrupo}
                      layout // Anima a mudança de posição na lista
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <div className="relative group flex items-center p-3 bg-white rounded-lg shadow-md border-l-4" style={{ borderColor: CORES_GRAFICO[index % CORES_GRAFICO.length] }}>
                        <button
                          onClick={() => onRemoveParticipant(ranking.id, p.nomeGrupo)}
                          title={`Remover ${p.nomeGrupo} do ranking`}
                          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-200 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                
                        <span className="text-2xl font-bold text-gray-500 w-12 text-center">{index + 1}º</span>
                        <img
                            src={p.fotoGrupo || '/logo-marista.png'}
                            alt={p.nomeGrupo}
                            className="w-12 h-12 rounded-full mx-4 object-cover"
                        />
                        <div className="flex-grow">
                            <p className="font-semibold text-gray-800">{p.nomeGrupo}</p>
                            <div className="font-bold text-lg">
                                {p.rentabilidadeAtual > 0.004 ? (
                                <span className="text-green-600">▲ {p.rentabilidadeAtual.toFixed(2)}%</span>
                                ) : p.rentabilidadeAtual < -0.004 ? (
                                <span className="text-red-600">▼ {Math.abs(p.rentabilidadeAtual).toFixed(2)}%</span>
                                ) : (
                                <span className="text-gray-500">{p.rentabilidadeAtual.toFixed(2)}%</span>
                                )}
                            </div>
                        </div>
                      </div>
                    </motion.div>
                    ))}
                </div>

                 <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-center mb-4">Evolução da Rentabilidade</h2>
            
            {/* ✅ INÍCIO DA CORREÇÃO */}
            {/* A condição agora é: "se houver PELO MENOS UMA data" */}
            {chartData.labels && chartData.labels.length > 0 ? (
              <div className="h-[500px]">
                <Line data={chartData} options={{
                    // Se houver apenas um ponto, esconde a legenda para não poluir
                    plugins: {
                        legend: { display: chartData.labels.length > 1 } 
                    },
                            scales: { 
                                x: { ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 20 } },
                                y: { ticks: { callback: (value) => `${Number(value).toFixed(2)}%` } } 
                            }
                        }} />
                      </div>
                    ) : (
                      <div className="h-[500px] flex items-center justify-center text-center text-gray-500 p-4">
                        Sem dados para exibir o gráfico de evolução.
                      </div>
                    )}
                </div>
            </div>
        )}

      {showAddModal && (
        <AddParticipantsModal
          onClose={() => setShowAddModal(false)}
          currentParticipants={ranking.participantes}
          onConfirm={(newParticipants) => {
            onAddParticipants(ranking.id, newParticipants);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}