import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Ativo } from '../types/Ativo';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  ativos: Ativo[];
  caixaFixa: number;
  caixaVariavel: number;
}

export default function AllocationCharts({ ativos, caixaFixa, caixaVariavel }: Props) {
  const { totalFixa, totalAcoes, totalFIIs, totalCripto } = useMemo(() => {
    let totalFixa = caixaFixa;
    let totalAcoes = 0;
    let totalFIIs = 0;
    let totalCripto = 0;

    ativos.forEach((ativo) => {
      const valor = ativo.tipo === 'rendaFixa'
        ? ativo.valorAtual
        : ativo.quantidade * ativo.valorAtual;

      if (ativo.tipo === 'rendaFixa') {
        totalFixa += valor;
      } else {
        if (ativo.subtipo === 'acao') totalAcoes += valor;
        else if (ativo.subtipo === 'fii') totalFIIs += valor;
        else if (ativo.subtipo === 'criptomoeda') totalCripto += valor;
      }
    });

    return { totalFixa, totalAcoes, totalFIIs, totalCripto };
  }, [ativos, caixaFixa]);

  const totalVariavel = totalAcoes + totalFIIs + totalCripto + caixaVariavel;
  const totalCarteira = totalFixa + totalVariavel;

  const dataMacro = {
    labels: ['Renda Fixa', 'Renda Variável'],
    datasets: [
      {
        data: [totalFixa, totalVariavel],
        backgroundColor: ['#3A7CA5', '#F18F01'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const dataVariavel = {
    labels: ['Ações', 'FIIs', 'Criptomoedas'],
    datasets: [
      {
        data: [totalAcoes, totalFIIs, totalCripto],
        backgroundColor: ['#2E86AB', '#73BA9B', '#D95D39'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 600, family: 'inherit' },
          color: '#64748b'
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        cornerRadius: 12,
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.raw as number;
            const percentage = totalCarteira > 0 ? ((val / ctx.chart._metasets[0].total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (totalCarteira === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 w-full animate-fade-in delay-200">
      {/* Macro Chart */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Perfil do investidor</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Fixa vs Variável
          </p>
        </div>
        <div className="relative w-full aspect-square max-h-[220px] flex items-center justify-center">
          <Doughnut data={dataMacro} options={options as any} />
        </div>
      </div>

      {/* Renda Variável Detail Chart */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center">
        <div className="text-center mb-6">
          <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">Diversificação</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Distribuição de Ativos
          </p>
        </div>
        <div className="relative w-full aspect-square max-h-[220px] flex items-center justify-center">
          {totalVariavel > 0 ? (
            <Doughnut data={dataVariavel} options={options as any} />
          ) : (
            <div className="text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <span className="block w-2 bg-slate-200 h-2 rounded-full" />
              </div>
              Nenhum capital em Renda Variável
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
