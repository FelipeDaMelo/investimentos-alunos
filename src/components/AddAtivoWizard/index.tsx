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
  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition"
  aria-label="Fechar"
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
              senha: dados.senha, // ✅ ADICIONE ESTA LINHA
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
              senha: dados.senha, // ✅ ADICIONE ESTA LINHA
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