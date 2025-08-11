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
  LogOut // Ícone para o LogOut
} from 'lucide-react';

// Conteúdo do tutorial atualizado
const passos = [
  {
    titulo: 'Login, LogOut e Senha',
    icone: <LockKeyhole className="w-7 h-7 text-blue-600" />,
    texto: `Acesse com o nome do grupo e crie uma senha de 6 dígitos. A senha será usada para confirmar todas as operações.\nNo painel principal, você encontrará um botão com o ícone <LogOut size={16} className="inline-block" /> para sair e retornar a esta tela.`
  },
  {
    titulo: 'Depósitos Iniciais',
    icone: <Banknote className="w-7 h-7 text-green-600" />,
    texto: 'Ao criar um grupo, você informa o valor total do investimento inicial e como ele será dividido percentualmente entre Renda Fixa e Variável. O sistema distribui o saldo automaticamente.'
  },
  {
    titulo: 'Depósitos (Aporte)',
    icone: <Receipt className="w-7 h-7 text-green-600" />,
    texto: 'Use o botão "Depositar" para adicionar mais "dinheiro" ao seu saldo disponível. Você pode escolher se o valor vai para a carteira de Renda Fixa ou Variável.'
  },
  {
    titulo: 'Transferência entre Carteiras',
    icone: <ArrowRightLeft className="w-7 h-7 text-orange-600" />,
    texto: 'O botão "Transferir" permite mover o saldo disponível entre as carteiras de Renda Fixa e Renda Variável, facilitando o rebalanceamento para novas compras.'
  },
  {
    titulo: 'Adicionar Ativos e Comentários',
    icone: <SquarePlus className="w-7 h-7 text-blue-600" />,
    texto: 'Adicione ativos reais como Ações, FIIs, Criptomoedas ou Títulos de Renda Fixa. Ao comprar ou vender, você pode adicionar um comentário para registrar sua estratégia, que aparecerá no extrato.'
  },
  {
    titulo: 'Atualizar Valores',
    icone: <Calculator className="w-7 h-7 text-green-600" />,
    texto: `Clique em "Atualizar Valores" para buscar os dados mais recentes do mercado. O sistema funciona de forma inteligente:
- **Renda Fixa:** O rendimento é recalculado desde a data da aplicação, usando juros compostos com base nas taxas CDI, SELIC e IPCA do dia.
- **Renda Variável:** Os preços de Ações, FIIs e Criptos são atualizados com base em suas cotações reais de mercado.
Após a atualização, o botão fica bloqueado por 60 segundos.`
  },
  {
    titulo: 'Dividendos (FIIs)',
    icone: <Banknote className="w-7 h-7 text-purple-600" />,
    texto: 'Ao clicar em "Informar Dividendo" em um FII, o sistema detecta automaticamente os meses em que você ainda não registrou o recebimento. Basta informar o valor por cota pago no mês, e o total será creditado no seu saldo.'
  },
  {
    titulo: 'Gráfico de Patrimônio',
    icone: <LineChart className="w-7 h-7 text-cyan-600" />,
    texto: 'Visualize a evolução da sua carteira. O gráfico é interativo: você pode dar zoom com o mouse/dedos e alternar entre as escalas Linear e Logarítmica. Ele também pode ser exportado como uma imagem PNG.'
  },
  {
    titulo: 'Histórico e Extrato em PDF',
    icone: <ReceiptText className="w-7 h-7 text-red-600" />,
    texto: 'Consulte o extrato completo com todas as suas operações: compras, vendas (com comentários), dividendos, impostos e transferências. Você pode exportar este histórico completo como um arquivo PDF.'
  },
  {
    titulo: 'Imposto de Renda (Leão)',
    icone: <span className="text-2xl" role="img" aria-label="leão">🦁</span>,
    texto: `O sistema calcula o IR devido e permite a dedução do saldo. Uma das regras mais importantes é implementada:
- **Prejuízos de meses anteriores são acumulados e usados para abater lucros futuros**, diminuindo o imposto a pagar.
- **Ações:** Isenção se as vendas no mês forem < R$ 20.000.
- **Cripto:** Isenção se as vendas no mês forem < R$ 35.000.
- **FIIs:** Lucros são sempre tributados em 20%.`
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-600 transition">
          <XCircle size={28} />
        </button>

        <div className="flex items-center gap-4 mb-4">
          {passos[etapa].icone}
          <h2 className="text-2xl font-bold text-blue-800">{passos[etapa].titulo}</h2>
        </div>

        {/* Usamos 'whitespace-pre-line' para que as quebras de linha (\n) no texto funcionem */}
        <p className="text-gray-700 text-lg leading-relaxed mb-8 whitespace-pre-line">
          {passos[etapa].texto}
        </p>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            className="text-sm px-5 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={etapa === 0}
          >
            Voltar
          </button>

          <span className="text-sm text-gray-500">Etapa {etapa + 1} de {total}</span>

          {etapa < total - 1 ? (
            <button
              onClick={() => setEtapa((e) => Math.min(total - 1, e + 1))}
              className="text-sm px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Ir para Simulação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}