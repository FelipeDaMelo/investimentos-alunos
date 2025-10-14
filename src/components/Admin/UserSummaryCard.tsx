// Caminho: src/components/Admin/UserSummaryCard.tsx

import React from 'react';
import { CircleArrowUp, CircleArrowDown, Download } from 'lucide-react';
import Button from '../Button'; // Importe seu componente de botão

export interface UserData {
  id: string;
  valorTotalAtual: number;
  rentabilidade: number;
  historico: any[];
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
    // Adicionado 'flex flex-col' para o alinhamento do botão
    <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 flex flex-col justify-between">
      <div>
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

      {/* Botão de Exportação Individual */}
      <div className="mt-4 pt-4 border-t">
        <Button 
            onClick={() => onExport(user)} 
            disabled={isExporting}
            className="w-full !py-2 text-sm" // Deixa o botão um pouco menor
            variant="secondary"
        >
            <Download size={16} className="inline-block mr-2" />
            {isExporting ? 'Exportando PDF...' : 'Exportar Extrato'}
        </Button>
      </div>
    </div>
  );
}