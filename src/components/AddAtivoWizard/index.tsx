import { useState } from 'react';
import TipoAtivoStep from './TipoAtivoStep';
import RendaFixaStep from './RendaFixaStep';
import RendaVariavelStep from './RendaVariavelStep';

interface AddAtivoWizardProps {
  onClose: () => void;
  onAddAtivo: (ativo: any) => void;
  valorFixaDisponivel: number;
  valorVariavelDisponivel: number;
}

export default function AddAtivoWizard({ 
  onClose, 
  onAddAtivo,
  valorFixaDisponivel,
  valorVariavelDisponivel
}: AddAtivoWizardProps) {
  const [step, setStep] = useState<'tipo' | 'fixa' | 'variavel'>('tipo');
  const [dadosAtivo, setDadosAtivo] = useState<any>({});

  const handleNext = (tipo: string, dados: any = {}) => {
    setDadosAtivo({ ...dadosAtivo, ...dados, tipo });
    setStep(tipo === 'rendaFixa' ? 'fixa' : 'variavel');
  };

  const handleSubmit = (dados: any) => {
    onAddAtivo({ 
      ...dadosAtivo,
      ...dados,
      id: Date.now().toString(),
      patrimonioPorDia: { [new Date().toISOString().split('T')[0]]: dados.valorInvestido },
      valorAtual: dados.valorInvestido
    });
    onClose();
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {step === 'tipo' && <TipoAtivoStep onNext={handleNext} />}
      {step === 'fixa' && (
        <RendaFixaStep
          onBack={() => setStep('tipo')}
          onSubmit={handleSubmit}
          saldoDisponivel={valorFixaDisponivel}
        />
      )}
      {step === 'variavel' && (
        <RendaVariavelStep
          onBack={() => setStep('tipo')}
          onSubmit={handleSubmit}
          saldoDisponivel={valorVariavelDisponivel}
        />
      )}
    </div>
  );
}