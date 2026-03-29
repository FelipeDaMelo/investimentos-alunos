import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ArrowLeft } from 'lucide-react';
import TipoAtivoStep from './TipoAtivoStep';
import RendaFixaStep from './RendaFixaStep';
import RendaVariavelStep from './RendaVariavelStep';
import { AtivoComSenha, RendaFixaAtivo, RendaVariavelAtivo } from '../../types/Ativo';

interface AddAtivoWizardProps {
  onClose: () => void;
  onAddAtivo: (ativo: AtivoComSenha, comentario: string) => Promise<boolean>;
  valorFixaDisponivel: number;
  valorVariavelDisponivel: number;
  quantidadeAtivos: number;
}

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="bg-white w-full h-full relative shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
    >
      {/* Dynamic Header */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
        <div className="flex items-center gap-4">
          {step !== 'tipo' && (
            <button 
              onClick={() => setStep('tipo')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-all group mr-2"
              title="Voltar"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
             <Plus size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {step === 'tipo' ? 'Novo Investimento' : step === 'fixa' ? 'Renda Fixa' : 'Renda Variável'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Passo {step === 'tipo' ? '1' : '2'} de 2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {(step === 'fixa' || step === 'variavel') && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo disponível</span>
              <span className="text-lg font-black text-blue-600">
                {(step === 'fixa' ? valorFixaDisponivel : valorVariavelDisponivel).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
              </span>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group"
            aria-label="Fechar"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none z-10"></div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 relative">
        <AnimatePresence mode="wait">
        {step === 'tipo' && (
          <motion.div
            key="tipo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <TipoAtivoStep onNext={handleNext} />
          </motion.div>
        )}
        
        {step === 'fixa' && (
          <motion.div
            key="fixa"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RendaFixaStep
              onBack={() => setStep('tipo')}
              onSubmit={async (dados, comentario) => {
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

                const sucesso = await onAddAtivo(ativoCompleto, comentario);
                if (sucesso) onClose();
              }}
              saldoDisponivel={valorFixaDisponivel}
            />
          </motion.div>
        )}
        
        {step === 'variavel' && (
          <motion.div
            key="variavel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <RendaVariavelStep
              onBack={() => setStep('tipo')}
              onSubmit={async (dados, comentario) => {
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
                  compras: [{ data: dados.dataInvestimento, valor: dados.valorInvestido }],
                  senha: dados.senha,
                };

                const sucesso = await onAddAtivo(ativoCompleto, comentario);
                if (sucesso) onClose();
              }}
              saldoDisponivel={valorVariavelDisponivel}
            />
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}