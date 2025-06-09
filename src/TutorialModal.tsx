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
  Image as ImageIcon
} from 'lucide-react';

const passos = [
  {
    titulo: 'Login e Senha',
    icone: <LockKeyhole className="w-7 h-7 text-blue-600" />,
    texto: 'Acesse com o nome do grupo e uma senha de 6 dígitos. A senha será usada para confirmar todas as operações sensíveis dentro da simulação.'
  },
  {
    titulo: 'Depósitos Iniciais',
    icone: <Banknote className="w-7 h-7 text-green-600" />,
    texto: 'Ao iniciar, você informa o valor total investido e escolhe a porcentagem para Renda Fixa e Variável. O sistema distribui automaticamente.'
  },
  {
    titulo: 'Depósitos',
    icone: <Receipt className="w-7 h-7 text-green-600" />,
    texto: 'Use o botão "Depositar" para incluir dinheiro no saldo disponível para novos investimentos. Você pode escolher o destino: Renda Fixa ou Variável.'
  },

  {
    titulo: 'Transferência entre Carteiras',
    icone: <ArrowRightLeft className="w-7 h-7 text-orange-600" />,
    texto: 'Use o botão "Transferir" para mover valores entre Renda Fixa e Renda Variável, conforme necessidade do grupo.'
  },
  {
    titulo: 'Adicionar Ativos',
    icone: <SquarePlus className="w-7 h-7 text-blue-600" />,
    texto: 'Adicione ativos reais como ações, FIIs, cripto ou títulos de renda fixa. O sistema calcula automaticamente rendimento, preço médio e impostos.'
  },
  {
    titulo: 'Atualizar Valores',
    icone: <Calculator className="w-7 h-7 text-green-600" />,
    texto: `Clique em "Atualizar Valores de Investimentos" para atualizar todos os ativos da carteira:
- Renda Fixa: o sistema recalcula os rendimentos usando as taxas definidas para cada ativo.
- Renda Variável: os valores são atualizados com base em cotações reais de mercado.
Após a atualização, os cards exibem a valorização ou desvalorização de cada item, e o gráfico é atualizado com o valor total da carteira naquele momento.
O botão exige senha e pode ser utilizado a cada 30 minutos.`
  },
  {
    titulo: 'Dividendos (FIIs)',
    icone: <Banknote className="w-7 h-7 text-purple-600" />,
    texto: 'A partir do dia 15 de cada mês, é possível informar manualmente dividendos recebidos por FIIs. O valor será somado ao saldo de Renda Variável.'
  },
  {
    titulo: 'Gráfico de Patrimônio',
    icone: <LineChart className="w-7 h-7 text-cyan-600" />,
    texto: 'Visualize a evolução da carteira de investimentos com base nas transações realizadas. Pode ser exportado como imagem PNG.'
  },
  {
    titulo: 'Histórico de Transações',
    icone: <ReceiptText className="w-7 h-7 text-red-600" />,
    texto: 'Consulte o extrato completo com compras, vendas, dividendos, impostos e transferências. Organizado por data e tipo de operação.'
  },
  {
    titulo: 'Imposto de Renda',
    icone: <span className="text-2xl" role="img" aria-label="leão">🦁</span>,
    texto: `O sistema calcula automaticamente:
- IR sobre Renda Fixa no resgate (tabela regressiva).
- IR sobre lucro de Renda Variável com o botão "Informar Imposto de Renda".
Critérios:
- Ações: isenção se vendas < R$20.000 no mês.
- Cripto: isenção se vendas < R$35.000 no mês.
- FIIs: sempre tributáveis se houver lucro.
O valor é deduzido automaticamente e registrado no histórico.`
  },
  {
    titulo: 'Foto do Grupo',
    icone: <ImageIcon className="w-7 h-7 text-pink-600" />,
    texto: 'Personalize sua experiência com o envio de uma imagem representando o grupo. Essa imagem aparece no topo da plataforma.'
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

        <p className="text-gray-700 text-lg leading-relaxed mb-8 whitespace-pre-line">{passos[etapa].texto}</p>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setEtapa((e) => Math.max(0, e - 1))}
            className="text-sm px-5 py-2 bg-gray-100 rounded hover:bg-gray-200"
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
