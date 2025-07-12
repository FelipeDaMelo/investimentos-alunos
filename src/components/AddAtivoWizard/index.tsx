import { useState } from 'react';
import TipoAtivoStep from './TipoAtivoStep';
import RendaFixaStep from './RendaFixaStep';
import RendaVariavelStep from './RendaVariavelStep';
// Importamos todos os tipos necessários
import { AtivoComSenha, RendaFixaAtivo, RendaVariavelAtivo } from '../../types/Ativo';

interface AddAtivoWizardProps {
  onClose: () => void;
  onAddAtivo: (ativo: AtivoComSenha) => Promise<boolean>;
  valorFixaDisponivel: number;
  valorVariavelDisponivel: number;
  quantidadeAtivos: number;
}

// Supondo que seus Steps passem estes tipos de dados no onSubmit
// Se os nomes das propriedades forem diferentes, ajuste aqui.
type DadosFormFixa = Omit<RendaFixaAtivo, 'id' | 'tipo' | 'valorAtual' | 'patrimonioPorDia'> & { senha?: string };
type DadosFormVariavel = Omit<RendaVariavelAtivo, 'id' | 'tipo' | 'valorAtual' | 'patrimonioPorDia' | 'compras'> & { senha?: string };


export default function AddAtivoWizard({ 
  onClose, 
  onAddAtivo,
  valorFixaDisponivel,
  valorVariavelDisponivel,
}: AddAtivoWizardProps) {
  const [step, setStep] = useState<'tipo' | 'fixa' | 'variavel'>('tipo');

  const handleNext = (tipo: 'rendaFixa' | 'rendaVariavel') => {
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
          onSubmit={async (dados: DadosFormFixa) => {
            if (!dados.senha || dados.senha.length !== 6) {
              alert('A senha deve conter 6 dígitos.');
              return;
            }

            const ativoCompleto: RendaFixaAtivo & { senha: string } = {
              ...dados,
              id: Date.now().toString(),
              tipo: 'rendaFixa',
              valorAtual: dados.valorInvestido,
              patrimonioPorDia: {
                [new Date().toISOString().split('T')[0]]: dados.valorInvestido
              },
              senha: dados.senha,
            };

            const sucesso = await onAddAtivo(ativoCompleto);
            if (sucesso) onClose();
          }}
          saldoDisponivel={valorFixaDisponivel}
        />
      )}
      
      {step === 'variavel' && (
        <RendaVariavelStep
          onBack={() => setStep('tipo')}
          onSubmit={async (dados: DadosFormVariavel) => {
            if (!dados.senha || dados.senha.length !== 6) {
              alert('A senha deve conter 6 dígitos.');
              return;
            }

            const ativoCompleto: RendaVariavelAtivo & { senha: string } = {
              ...dados,
              id: Date.now().toString(),
              tipo: 'rendaVariavel',
              valorAtual: dados.valorInvestido / (dados.quantidade || 1),
              patrimonioPorDia: {
                [new Date().toISOString().split('T')[0]]: dados.valorInvestido
              },
              // A propriedade 'compras' é criada aqui
              compras: [{ data: dados.dataInvestimento, valor: dados.valorInvestido }],
              senha: dados.senha,
            };

            const sucesso = await onAddAtivo(ativoCompleto);
            if (sucesso) onClose();
          }}
          saldoDisponivel={valorVariavelDisponivel}
        />
      )}
    </div>
  );
}