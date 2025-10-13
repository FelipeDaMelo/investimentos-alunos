// Caminho: src/components/Ranking/RankingDetail.tsx (VERSÃO COM FILTRO DE DATA)

import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking, RankingParticipantData } from '../../types/Ranking';
import Button from '../Button';
import { Trash2 } from 'lucide-react';
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
}

export default function RankingDetail({ ranking, onBack, onDelete }: Props) {
  const [participantsData, setParticipantsData] = useState<RankingParticipantData[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    setLoading(true);

    // ✅ 2. Crie um array para os "ouvintes" (listeners)
    const unsubscribes: (() => void)[] = [];

    // Mapeia os participantes para criar os listeners
    ranking.participantes.forEach((participantId) => {
      const docRef = doc(db, "usuarios", participantId);
      
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Lógica de cálculo de rentabilidade (a mesma de antes)
          const valorCotaPorDia = data.valorCotaPorDia || {};
          const datasOrdenadas = Object.keys(valorCotaPorDia).sort();
          if (datasOrdenadas.length === 0) return;

          const rentabilidadePorDia: Record<string, number> = {};
          datasOrdenadas.forEach(dia => {
            rentabilidadePorDia[dia] = (valorCotaPorDia[dia] - 1) * 100;
          });
          
          const ultimaData = datasOrdenadas[datasOrdenadas.length - 1];
          const rentabilidadeAtual = rentabilidadePorDia[ultimaData];

          const participantData: RankingParticipantData = {
            nomeGrupo: participantId,
            fotoGrupo: data.fotoGrupo,
            rentabilidadeAtual,
            rentabilidadePorDia,
          };

          // ✅ 3. Atualiza o estado de forma funcional
          // Pega a lista atual, remove o participante (caso já exista) e adiciona a versão atualizada
          setParticipantsData(prevData => {
            const otherParticipants = prevData.filter(p => p.nomeGrupo !== participantId);
            const newData = [...otherParticipants, participantData];
            // Re-ordena a lista a cada atualização
            newData.sort((a, b) => b.rentabilidadeAtual - a.rentabilidadeAtual);
            return newData;
          });
        }
      });
      
      unsubscribes.push(unsubscribe);
    });
    
    setLoading(false); // Pode ser movido para cá para uma UI mais rápida

    // ✅ 4. Função de limpeza: Quando o componente for desmontado,
    // todos os "ouvintes" são desativados para economizar recursos.
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };

  }, [ranking]);

  const chartData = useMemo(() => {
    // ✅ INÍCIO DA MODIFICAÇÃO
    const hojeString = new Date().toISOString().split('T')[0];

    let allDates = [...new Set(participantsData.flatMap(p => Object.keys(p.rentabilidadePorDia)))].sort();

    // Filtra o array de datas para conter apenas hoje e dias futuros
    allDates = allDates.filter(date => date >= hojeString);

    // Se após o filtro não sobrar nenhuma data (ex: dados só até ontem),
    // pegamos apenas a data mais recente disponível para mostrar pelo menos o ponto atual.
    if (allDates.length === 0) {
        const originalDates = [...new Set(participantsData.flatMap(p => Object.keys(p.rentabilidadePorDia)))].sort();
        if (originalDates.length > 0) {
            allDates = [originalDates[originalDates.length - 1]];
        }
    }
    // ✅ FIM DA MODIFICAÇÃO
    
    return {
      labels: allDates.map(date => {
        const [ano, mes, dia] = date.split('-');
        return `${dia}/${mes}/${ano.slice(2)}`;
      }),
      datasets: participantsData.map((p, index) => ({
        label: p.nomeGrupo,
        data: allDates.map(date => p.rentabilidadePorDia[date] ?? null),
        borderColor: CORES_GRAFICO[index % CORES_GRAFICO.length],
        backgroundColor: CORES_GRAFICO[index % CORES_GRAFICO.length] + '33',
        tension: 0.1,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 6,
      })),
    };
  }, [participantsData]);

  const formatRankingName = (name: string) => {
    return name.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in">
        <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{formatRankingName(ranking.nome)}</h1>
            <div className="flex gap-4">
            <Button onClick={onBack} variant="secondary">Voltar para Rankings</Button>
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
                    <div key={p.nomeGrupo} className="flex items-center p-3 bg-white rounded-lg shadow-md border-l-4" style={{ borderColor: CORES_GRAFICO[index % CORES_GRAFICO.length] }}>
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
                    ))}
                </div>

                <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-center mb-4">Evolução da Rentabilidade</h2>
                    <div className="h-[500px]">
                        <Line data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toFixed(2)}%` } },
                            legend: { position: 'bottom' }
                            },
                            scales: { 
                            x: { ticks: { maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 20 } },
                            y: { ticks: { callback: (value) => `${Number(value).toFixed(2)}%` } } 
                            }
                        }} />
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}