// Caminho: src/components/Admin/UserSummaryCard.tsx

import React from 'react';
import { CircleArrowUp, CircleArrowDown, Download, BarChart2, ShieldCheck } from 'lucide-react';

export interface UserData {
  id: string;
  valorTotalAtual: number;
  rentabilidade: number;
  historico: any[];
  fotoGrupo: string | null;
}

// Adicione as novas props que o card irá receber
interface UserSummaryCardProps {
    user: UserData;
    onExport: (user: UserData) => void;
    isExporting: boolean;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function UserSummaryCard({ user, onExport, isExporting }: UserSummaryCardProps) {
   return (
    <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-6 flex flex-col gap-6 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50 transition-all duration-300 group">
      
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <div className="flex items-center gap-4 overflow-hidden">
          <img 
            src={user.fotoGrupo || "/logo-marista.png"} 
            alt={user.id} 
            className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0" 
          />
          <h3 className="font-black text-xl text-slate-800 truncate tracking-tight">{user.id}</h3>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
          <ShieldCheck size={16} />
        </div>
      </div>

      <div className="space-y-5 flex-1">
        <div className="bg-slate-50 rounded-[1.5rem] p-4 flex flex-col gap-1 border border-slate-100/50">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <BarChart2 size={12}/> Patrimônio Total
          </p>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(user.valorTotalAtual)}</p>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rentabilidade</p>
          <div className={`text-xl font-black tracking-tight flex items-center gap-1.5 ${user.rentabilidade > 0.004 ? 'text-green-500' : user.rentabilidade < -0.004 ? 'text-red-500' : 'text-slate-400'}`}>
            {user.rentabilidade > 0.004 && <CircleArrowUp size={18} strokeWidth={3} className="text-green-400" />}
            {user.rentabilidade < -0.004 && <CircleArrowDown size={18} strokeWidth={3} className="text-red-400" />}
            <span>{user.rentabilidade.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <button 
          onClick={() => onExport(user)} 
          disabled={isExporting}
          className="w-full py-4 bg-slate-50 text-slate-500 hover:bg-slate-800 hover:text-white rounded-[1.5rem] font-bold text-sm tracking-tight transition-all flex justify-center items-center gap-2 group-hover:bg-slate-100 active:scale-95 disabled:opacity-50"
      >
          <Download size={18} />
          {isExporting ? 'Exportando Histórico...' : 'Exportar Extrato PDF'}
      </button>

    </div>
  );
}