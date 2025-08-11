import { useState } from 'react';
import {
  XCircle,
  LockKeyhole,
  Banknote,
  ArrowRightLeft,
  SquarePlus,
  Calculator,
  ReceiptText,
  LineChart,
  Receipt,
  Image as ImageIcon,
  LogOut
} from 'lucide-react';

// Componente de Destaque (sem alterações)
interface HighlightProps {
  children: React.ReactNode;
  color?: 'blue' | 'indigo' | 'violet' | 'green' | 'red';
}

const Highlight = ({ children, color = 'blue' }: HighlightProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    violet: 'bg-violet-100 text-violet-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
  };

  return (
    <code className={`font-sans ${colorClasses[color]} font-semibold px-2 py-1 rounded-md text-base`}>
      {children}
    </code>
  );
};

// Conteúdo (sem alterações)
const passos = [
  {
    titulo: 'Login, LogOut e Senha',
    icone: <LockKeyhole className="w-7 h-7 text-blue-600" />,
    texto: (
      <>
        Acesse com o nome do grupo e crie uma senha de 6 dígitos. A senha será usada para confirmar todas as operações.
        <br /><br />
        No painel principal, você encontrará um botão <LogOut size={18} className="inline-block text-red-600 mx-1" /> para sair e retornar a esta tela.
      </>
    )
  },
  {
    titulo: 'Depósitos Iniciais',
    icone: <Banknote className="w-7 h-7 text-green-600" />,
    texto: 'Ao criar um grupo, você informa o valor total do investimento inicial e como ele será dividido percentualmente entre Renda Fixa e Variável. O sistema distribui o saldo automaticamente.'
  },
  {
    titulo: 'Depósitos (Aporte)',
    icone: <Receipt className="w-7 h-7 text-green-600" />,
    texto: <>Use o botão <Highlight>Depositar</Highlight> para adicionar mais "dinheiro" ao seu saldo disponível. Você pode escolher se o valor vai para a carteira de Renda Fixa ou Variável.</>
  },
  {
    titulo: 'Transferência entre Carteiras',
    icone: <ArrowRightLeft className="w-7 h-7 text-orange-600" />,
    texto: <>O botão <Highlight color="indigo">Transferir</Highlight> permite mover o saldo disponível entre as carteiras de Renda Fixa e Variável, facilitando o rebalanceamento para novas compras.</>
  },
  {
    titulo: 'Adicionar Ativos e Comentários',
    icone: <SquarePlus className="w-7 h-7 text-blue-600" />,
    texto: <>Adicione ativos clicando em <Highlight>Adicionar Novo Ativo</Highlight>. Você pode registrar um comentário para cada compra ou venda, que aparecerá no extrato.</>
  },
  {
    titulo: 'Atualizar Valores',
    icone: <Calculator className="w-7 h-7 text-green-600" />,
    texto: (
      <>
        Clique em <Highlight color="green">Atualizar Valores de Investimentos</Highlight> para buscar os dados mais recentes do mercado. O sistema funciona de forma inteligente:
        <ul className="list-disc list-inside mt-3 space-y-2 text-base">
          <li><strong>Renda Fixa:</strong> O rendimento é recalculado desde a data da aplicação, usando juros compostos com base nas taxas CDI, SELIC e IPCA do dia.</li>
          <li><strong>Renda Variável:</strong> Os preços de Ações, FIIs e Criptos são atualizados com base em suas cotações reais de mercado.</li>
        </ul>
        <br/>
        Após a atualização, o botão fica bloqueado por 60 segundos.
      </>
    )
  },
  {
    titulo: 'Dividendos (FIIs)',
    icone: <Banknote className="w-7 h-7 text-purple-600" />,
    texto: <>Ao clicar em <Highlight>Informar Dividendo</Highlight> em um FII, o sistema detecta automaticamente os meses em que você ainda não registrou o recebimento. Basta informar o valor por cota, e o total será creditado no seu saldo.</>
  },
  {
    titulo: 'Gráfico de Patrimônio',
    icone: <LineChart className="w-7 h-7 text-cyan-600" />,
    texto: 'Visualize a evolução da sua carteira. O gráfico é interativo: você pode dar zoom e alternar entre as escalas Linear e Logarítmica. Ele também pode ser exportado como uma imagem PNG.'
  },
  {
    titulo: 'Histórico e Extrato em PDF',
    icone: <ReceiptText className="w-7 h-7 text-red-600" />,
    texto: <>Consulte o extrato completo com todas as suas operações clicando em <Highlight color="violet">Ver Extrato</Highlight>. Você pode exportar este histórico completo como um arquivo PDF.</>
  },
  {
    titulo: 'Imposto de Renda (Leão)',
    icone: <span className="text-2xl" role="img" aria-label="leão">🦁</span>,
    texto: (
      <>
        Clique em <Highlight color="red">Informar Imposto de Renda</Highlight> para que o sistema calcule o IR devido e permita a dedução do saldo. Uma das regras mais importantes é implementada:
        <ul className="list-disc list-inside mt-3 space-y-2 text-base">
          <li><strong>Prejuízos de meses anteriores são acumulados e usados para abater lucros futuros</strong>, diminuindo o imposto a pagar.</li>
          <li><strong>Ações:</strong> Isenção se as vendas no mês forem &lt; R$ 20.000.</li>
          <li><strong>Cripto:</strong> Isenção se as vendas no mês forem &lt; R$ 35.000.</li>
          <li><strong>FIIs:</strong> Lucros são sempre tributados em 20%.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Gerenciamento do Grupo',
    icone: <ImageIcon className="w-7 h-7 text-pink-600" />,
    texto: 'Clique na foto para abrir o menu. Você pode personalizar sua experiência enviando uma imagem para o grupo ou, se necessário, excluir permanentemente o grupo e todos os seus dados.'
  }
];

interface Props {
  onClose: () => void;
}

export default function TutorialModal({ onClose }: Props) {
  const [etapa, setEtapa] = useState(0);
  const total = passos.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      {/* --- LARGURA MÁXIMA REDUZIDA DE 4xl para 2xl --- */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        <header className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            {passos[etapa].icone}
            <h2 className="text-2xl font-bold text-gray-800">{passos[etapa].titulo}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
            <XCircle size={28} />
          </button>
        </header>

        <div className="p-6 text-gray-700 text-lg leading-relaxed overflow-y-auto">
          {passos[etapa].texto}
        </div>

        {/* --- FOOTER ATUALIZADO PARA CENTRALIZAR O CONTEÚDO --- */}
        <footer className="p-6 border-t mt-auto flex justify-center items-center gap-6 bg-gray-50 rounded-b-2xl">
          {/* Botão Voltar */}
          <button
            onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            className="text-sm px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 disabled:opacity-50 transition-all"
            disabled={etapa === 0}
          >
            Voltar
          </button>

          {/* Indicador de Progresso */}
          <div className="flex items-center gap-2">
            {passos.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all ${etapa === index ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Botão Próximo / Finalizar */}
          {etapa < total - 1 ? (
            <button
              onClick={() => setEtapa((e) => Math.min(total - 1, e + 1))}
              className="text-sm px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
            >
              Ir para Simulação
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}