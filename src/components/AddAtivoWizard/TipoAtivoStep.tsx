import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface TipoAtivoStepProps {
  onNext: (tipo: 'rendaFixa' | 'rendaVariavel') => void;
}

export default function TipoAtivoStep({ onNext }: TipoAtivoStepProps) {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Novo Investimento</h2>
        <p className="text-slate-500 mt-2 font-medium">Selecione a categoria do seu novo ativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          type="button"
          onClick={() => onNext('rendaFixa')}
          className="group relative bg-slate-50 hover:bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <TrendingUp size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Renda Fixa</h3>
          <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed">CDB, LCI, LCA, Tesouro Direto e investimentos de baixo risco.</p>
        </button>

        <button
          type="button"
          onClick={() => onNext('rendaVariavel')}
          className="group relative bg-slate-50 hover:bg-white p-8 rounded-[2rem] border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all duration-300 text-left flex flex-col items-center md:items-start text-center md:text-left"
        >
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <BarChart3 size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Renda Variável</h3>
          <p className="text-sm text-slate-500 mt-3 font-medium leading-relaxed">Ações, FIIs, Criptomoedas e ativos com maior potencial de retorno.</p>
        </button>
      </div>
    </div>
  );
}
