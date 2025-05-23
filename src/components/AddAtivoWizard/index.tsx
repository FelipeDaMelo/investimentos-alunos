import { useState } from 'react';
import TipoAtivoStep from './TipoAtivoStep';
import RendaFixaStep from './RendaFixaStep';
import RendaVariavelStep from './RendaVariavelStep';
import { Ativo } from '../../types/Ativo';
import { AtivoComSenha } from '../../types/Ativo';

interface AddAtivoWizardProps {
  onClose: () => void;
  onAddAtivo: (ativo: AtivoComSenha) => Promise<boolean>;
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
  onSubmit={async (dados) => {
    if (!dados.senha || dados.senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    const { senha, ...ativoSemSenha } = dados;

    const sucesso = await onAddAtivo({
      ...dadosAtivo,
      ...ativoSemSenha,
      senha,
      id: Date.now().toString(),
      valorAtual: dados.valorInvestido,
      patrimonioPorDia: {
        [new Date().toISOString().split('T')[0]]: dados.valorInvestido
      }
    });

    if (sucesso) {
      onClose(); // só fecha se a senha estiver correta
    }
  }}
  saldoDisponivel={valorFixaDisponivel}
/>
      )}
      
      {step === 'variavel' && (
  <RendaVariavelStep
  onBack={() => setStep('tipo')}
  onSubmit={async (dados) => {
    if (!dados.senha || dados.senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    const { senha, ...ativoSemSenha } = dados;

    const sucesso = await onAddAtivo({
      ...dadosAtivo,
      ...ativoSemSenha,
      senha,
      id: Date.now().toString(),
      valorAtual: dados.valorInvestido / (dados.quantidade || 1),
      patrimonioPorDia: {
        [new Date().toISOString().split('T')[0]]: dados.valorInvestido
      }
    });

    if (sucesso) {
      onClose(); // só fecha se a senha estiver correta
    }
  }}
  saldoDisponivel={valorVariavelDisponivel}
/>
)}
    </div>
  );
}