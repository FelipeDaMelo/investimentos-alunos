import React from 'react';
import { CircleArrowUp, CircleArrowDown } from 'lucide-react';

// Interface para garantir que o componente receba os dados corretos
export interface UserData {
  id: string;
  valorTotalAtual: number;
  rentabilidade: number;
  historico: any[];
}

// Função para formatar números como moeda brasileira
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function UserSummaryCard({ user }: { user: UserData }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
      <h3 className="font-bold text-lg truncate">{user.id}</h3>
      
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500">Patrimônio Total</p>
          <p className="text-2xl font-semibold text-gray-800">{formatCurrency(user.valorTotalAtual)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Rentabilidade (Cotas)</p>
          <div className={`text-xl font-bold flex items-center gap-1 ${user.rentabilidade > 0.004 ? 'text-green-600' : user.rentabilidade < -0.004 ? 'text-red-600' : 'text-gray-600'}`}>
            {user.rentabilidade > 0.004 && <CircleArrowUp size={18} />}
            {user.rentabilidade < -0.004 && <CircleArrowDown size={18} />}
            <span>{user.rentabilidade.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}