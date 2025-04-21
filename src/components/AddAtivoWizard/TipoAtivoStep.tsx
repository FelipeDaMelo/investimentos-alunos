//src/components/AddAtivoWizard/TipoAtivoStep.tsx
import React from 'react';

interface TipoAtivoStepProps {
  onNext: (tipo: 'rendaFixa' | 'rendaVariavel') => void;
}

export default function TipoAtivoStep({ onNext }: TipoAtivoStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Selecione o Tipo de Ativo</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => onNext('rendaFixa')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
        >
          <h3 className="text-lg font-medium">📈 Renda Fixa</h3>
          <p className="text-sm text-gray-600 mt-2">CDB, LCI, LCA, Tesouro Direto, etc.</p>
        </button>
        
        <button
          type="button"
          onClick={() => onNext('rendaVariavel')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
        >
          <h3 className="text-lg font-medium">📊 Renda Variável</h3>
          <p className="text-sm text-gray-600 mt-2">Ações, FIIs, Criptomoedas, ETFs</p>
        </button>
      </div>
    </div>
  );
}