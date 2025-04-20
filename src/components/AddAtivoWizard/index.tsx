import { useState } from 'react';
import TipoAtivoStep from './TipoAtivoStep';
import RendaFixaStep from './RendaFixaStep';
import RendaVariavelStep from './RendaVariavelStep';
import { Ativo } from '../../types/Ativo';

interface AddAtivoWizardProps {
  onClose: () => void;
  onAddAtivo: (ativo: Ativo) => void;
  valorFixaDisponivel: number;
  valorVariavelDisponivel: number;
  quantidadeAtivos: number;
}

export default function AddAtivoWizard({ 
  onClose, 
  onAddAtivo,
  valorFixaDisponivel,
  valorVariavelDisponivel,
  quantidadeAtivos
}: AddAtivoWizardProps) {
  const [step, setStep] = useState<'tipo' | 'fixa' | 'variavel'>('tipo');
  const [dadosAtivo, setDadosAtivo] = useState<Partial<Ativo>>({});

  const handleNext = (tipo: 'rendaFixa' | 'rendaVariavel', dados: Partial<Ativo> = {}) => {
    setDadosAtivo({ ...dadosAtivo, ...dados, tipo });
    setStep(tipo === 'rendaFixa' ? 'fixa' : 'variavel');
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {step === 'tipo' && (
        <TipoAtivoStep 
          onNext={handleNext} 
        />
      )}
      
      {step === 'fixa' && (
        <RendaFixaStep
          onBack={() => setStep('tipo')}
          onSubmit={(dados) => {
            onAddAtivo({
              ...dadosAtivo,
              ...dados,
              id: Date.now().toString(),
              valorAtual: dados.valorInvestido,
              patrimonioPorDia: { [new Date().toISOString().split('T')[0]]: dados.valorInvestido }
            } as Ativo);
            onClose();
          }}
          saldoDisponivel={valorFixaDisponivel}
        />
      )}
      
      {step === 'variavel' && (
        <RendaVariavelStep
          onBack={() => setStep('tipo')}
          onSubmit={(dados) => {
            onAddAtivo({
              ...dadosAtivo,
              ...dados,
              id: Date.now().toString(),
              valorAtual: dados.valorInvestido / (dados.quantidade || 1),
              patrimonioPorDia: { [new Date().toISOString().split('T')[0]]: dados.valorInvestido }
            } as Ativo);
            onClose();
          }}
          saldoDisponivel={valorVariavelDisponivel}
        />
      )}
    </div>
  );
}