import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LockKeyhole,
  Banknote,
  ArrowRightLeft,
  SquarePlus,
  Calculator,
  ReceiptText,
  LineChart,
  Receipt,
  Image as ImageIcon,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Play
} from 'lucide-react';

// Componente de Destaque (Premium)
interface HighlightProps {
  children: React.ReactNode;
  color?: 'blue' | 'indigo' | 'violet' | 'green' | 'red';
}

const Highlight = ({ children, color = 'blue' }: HighlightProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span className={`inline-flex items-center font-bold px-2 py-0.5 rounded-lg border shadow-sm ${colorClasses[color]} mx-1`}>
      {children}
    </span>
  );
};

// Conteúdo (sem alterações na lógica de texto)
const passos = [
  {
    titulo: 'Login e Segurança',
    icone: <LockKeyhole className="w-8 h-8 text-blue-500" />,
    texto: (
      <div className="space-y-4">
        <p>Acesse com o nome do grupo e crie uma senha de 6 dígitos. A senha será usada para confirmar todas as operações, garantindo a integridade dos seus dados.</p>
        <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm"><LogOut size={20} className="text-red-500" /></div>
          <p className="text-sm font-medium text-slate-600">No painel principal, use este botão para sair com segurança.</p>
        </div>
      </div>
    )
  },
  {
    titulo: 'Configuração Inicial',
    icone: <Banknote className="w-8 h-8 text-green-500" />,
    texto: 'Ao criar um grupo, você informa o valor total do investimento inicial e como ele será dividido percentualmente entre Renda Fixa e Variável. O sistema distribui o saldo automaticamente.'
  },
  {
    titulo: 'Depósitos (Aportes)',
    icone: <Receipt className="w-8 h-8 text-emerald-500" />,
    texto: <>Use o botão <Highlight>Depositar</Highlight> para adicionar mais "dinheiro" ao seu saldo disponível. Você pode escolher se o valor vai para a carteira de Renda Fixa ou Variável, permitindo novos investimentos.</>
  },
  {
    titulo: 'Mover Saldo',
    icone: <ArrowRightLeft className="w-8 h-8 text-orange-500" />,
    texto: <>O botão <Highlight color="indigo">Transferir</Highlight> permite mover o saldo disponível entre as carteiras de Renda Fixa e Variável, facilitando o rebalanceamento estratégico para suas novas compras.</>
  },
  {
    titulo: 'Adicionar Ativos',
    icone: <SquarePlus className="w-8 h-8 text-blue-500" />,
    texto: <>Adicione ativos clicando em <Highlight color="blue">Adicionar Novo Ativo</Highlight>. Você pode registrar um comentário para cada compra ou venda, mantendo um diário detalhado de suas decisões.</>
  },
  {
    titulo: 'Inteligência de Mercado',
    icone: <Calculator className="w-8 h-8 text-indigo-500" />,
    texto: (
      <div className="space-y-4">
        <p>Clique em <Highlight color="green">Atualizar Valores</Highlight> para sincronizar sua carteira com o mercado real:</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm mb-1">Renda Fixa</h4>
            <p className="text-sm text-slate-500">Recalculado com juros compostos usando as taxas reais de mercado (CDI, SELIC, IPCA).</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm mb-1">Renda Variável</h4>
            <p className="text-sm text-slate-500">Ações, FIIs e Cripto atualizados com cotações em tempo real.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    titulo: 'Ganhos Passivos',
    icone: <Banknote className="w-8 h-8 text-purple-500" />,
    texto: <>Ao clicar em <Highlight color="violet">Informar Dividendo</Highlight> em um FII, o sistema detecta automaticamente os meses pendentes. Informe o valor por cota e o crédito será feito instantaneamente.</>
  },
  {
    titulo: 'Visualização Avançada',
    icone: <LineChart className="w-8 h-8 text-cyan-500" />,
    texto: 'O gráfico de patrimônio é interativo: zoom no eixo X, filtro por legenda, alternância de escalas (linear/log) e exportação para imagem PNG para compartilhar seus resultados.'
  },
  {
    titulo: 'Transparência Total',
    icone: <ReceiptText className="w-8 h-8 text-red-500" />,
    texto: <>Consulte o extrato completo com todas as suas operações clicando em <Highlight color="violet">Ver Extrato</Highlight>. Você pode exportar este histórico completo como um arquivo PDF profissional.</>
  },
  {
    titulo: 'Fiscal e IR',
    icone: <span className="text-3xl" role="img" aria-label="leão">🦁</span>,
    texto: (
      <div className="space-y-4">
        <p>Clique em <Highlight color="red">Informar IR</Highlight> para calcular deduções automáticas seguindo regras reais:</p>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-slate-600">Compensação de prejuízos acumulados.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-slate-600">Isenções mensais (R$ 20k Ações / R$ 35k Cripto).</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500 font-bold">✓</span>
            <span className="text-slate-600">Tributação padrão de 20% para FIIs.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    titulo: 'Perfil do Grupo',
    icone: <ImageIcon className="w-8 h-8 text-pink-500" />,
    texto: 'Personalize sua experiência enviando uma imagem para o grupo através do menu de perfil. Você também pode gerenciar as configurações fundamentais do seu grupo aqui.'
  }
];

interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  const [etapa, setEtapa] = useState(0);
  const total = passos.length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-slate-100"
      >
        <div className="relative p-10 flex-1 flex flex-col min-h-[450px]">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-500 transition-colors bg-slate-50 rounded-full"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={etapa}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center text-center space-y-8 mt-4"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center shadow-inner">
                {passos[etapa].icone}
              </div>
              
              <div className="space-y-4 max-w-lg">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  {passos[etapa].titulo}
                </h2>
                <div className="text-slate-500 text-lg leading-relaxed font-medium">
                  {passos[etapa].texto}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mt-10">
            {passos.map((_, index) => (
              <motion.div
                key={index}
                className="h-1.5 rounded-full bg-slate-100 relative overflow-hidden"
                animate={{ 
                  width: etapa === index ? 24 : 8,
                  backgroundColor: etapa === index ? "#3b82f6" : "#f1f5f9"
                }}
              />
            ))}
          </div>
        </div>

        <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center px-10">
          <button
            onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            className={`flex items-center gap-2 text-slate-600 font-bold transition-all ${etapa === 0 ? 'opacity-0 pointer-events-none' : 'hover:text-slate-900'}`}
          >
            <ChevronLeft size={20} />
            Voltar
          </button>

          <div className="flex gap-4">
            {etapa < total - 1 ? (
              <button
                onClick={() => setEtapa((e) => Math.min(total - 1, e + 1))}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
              >
                Próximo
                <ChevronRight size={20} className="text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                <Play size={18} fill="currentColor" />
                Iniciar Experiência
              </button>
            )}
          </div>
        </footer>
      </motion.div>
    </div>
  );
}