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
            className="btn-close"
            aria-label="Fechar"
          >
            "Cancelar Ativo"
          </button>
        )}
        <h2 className="text-2xl font-bold text-center">Selecione o Tipo de Ativo</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNext('rendaFixa')}
          className="btn-option"
        >
          <h3 className="text-lg font-medium">📈 Renda Fixa</h3>
          <p className="text-sm text-black-600 mt-2">CDB, LCI, LCA, Tesouro Direto, etc.</p>
        </button>

        <button
          type="button"
          onClick={() => onNext('rendaVariavel')}
          className="btn-option"
        >
          <h3 className="text-lg font-medium">📊 Renda Variável</h3>
          <p className="text-sm text-black-600 mt-2">Ações, FIIs, Criptomoedas</p>
        </button>
      </div>
    </div>
  );
}
