import React from 'react';

interface TipoAtivoStepProps {
  onNext: (tipo: 'rendaFixa' | 'rendaVariavel') => void;
  onClose?: () => void;
}

export default function TipoAtivoStep({ onNext, onClose }: TipoAtivoStepProps) {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex flex-col items-center space-y-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white text-lg font-bold transition"
            aria-label="Fechar"
          >
            ×
          </button>
        )}
        <h2 className="text-2xl font-bold text-center">Selecione o Tipo de Ativo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNext('rendaFixa')}
          className="bg-blue-200 hover:bg-blue-300 text-gray-800 p-6 rounded-xl shadow-md transition-all text-left"
        >
          <h3 className="text-lg font-semibold">📈 Renda Fixa</h3>
          <p className="text-sm text-gray-700 mt-2">CDB, LCI, LCA, Tesouro Direto, etc.</p>
        </button>

        <button
          type="button"
          onClick={() => onNext('rendaVariavel')}
          className="bg-blue-200 hover:bg-blue-300 text-gray-800 p-6 rounded-xl shadow-md transition-all text-left"
        >
          <h3 className="text-lg font-semibold">📊 Renda Variável</h3>
          <p className="text-sm text-gray-700 mt-2">Ações, FIIs, Criptomoedas</p>
        </button>
      </div>
    </div>
  );
}
