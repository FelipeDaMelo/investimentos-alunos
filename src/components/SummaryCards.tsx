import React from 'react';
import { Wallet, CircleArrowUp, CircleArrowDown, Receipt, ArrowRightLeft, ReceiptText } from 'lucide-react';
import Button from './Button';

interface SummaryCardsProps {
  valorFixaDisponivel: number;
  valorVariavelDisponivel: number;
  valorTotalAtual: number;
  variacaoPercentual: number;
  formatCurrency: (value: number) => string;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  valorFixaDisponivel,
  valorVariavelDisponivel,
  valorTotalAtual,
  variacaoPercentual,
  formatCurrency,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 w-full animate-fade-in delay-75">
      {/* Renda Fixa */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
        <div className="bg-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
          <Receipt size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Renda Fixa (Disponível)</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(valorFixaDisponivel)}</p>
        </div>
      </div>

      {/* Renda Variável */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow group">
        <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
          <ArrowRightLeft size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Renda Variável (Disponível)</p>
          <p className="text-xl font-bold text-slate-800 tracking-tight">{formatCurrency(valorVariavelDisponivel)}</p>
        </div>
      </div>

      {/* Valor Total */}
      <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100 flex items-center gap-4 hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform z-10">
          <Wallet size={24} />
        </div>
        <div className="z-10">
          <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-1">Valor Total da Carteira</p>
          <p className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(valorTotalAtual)}</p>
          <div className={`mt-1 text-[10px] font-bold flex items-center gap-0.5 ${variacaoPercentual >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <span>{variacaoPercentual >= 0 ? '▲' : '▼'} {Math.abs(variacaoPercentual).toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
