import { useMemo, useRef } from 'react';
import { XCircle, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Button from './Button';

// --- INÍCIO DAS FUNÇÕES DE FORMATAÇÃO INTERNAS ---

const formatCurrency = (value: number) => {
  if (Math.abs(value) < 1e-9) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatarDataHoraBr = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('pt-BR');
};

/**
 * Converte uma string "YYYY-MM" para "Nome do Mês de YYYY".
 * Ex: "2025-06" -> "Junho de 2025"
 */
function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

/**
 * Converte o subtipo técnico para um nome amigável no plural.
 * Ex: "acao" -> "Ações"
 */
function formatarSubtipo(subtipo: string): string {
  switch (subtipo?.toLowerCase()) {
    case 'acao':
      return 'Ações';
    case 'fii':
      return 'FIIs';
    case 'criptomoeda':
      return 'Criptomoedas';
    default:
      return subtipo?.toUpperCase() || 'N/D';
  }
}

// --- FIM DAS FUNÇÕES DE FORMATAÇÃO INTERNAS ---


// Tipos
interface HistoricoItem {
  tipo: 'deposito' | 'compra' | 'venda' | 'dividendo' | 'transferencia' | 'ir';
  valor: number;
  destino?: 'fixa' | 'variavel';
  nome?: string;
  data: string; // ISO String
  valorBruto?: number;
  valorLiquido?: number;
  imposto?: number;
  diasAplicado?: number;
  categoria?: 'rendaFixa' | 'rendaVariavel';
  subtipo?: 'acao' | 'fii' | 'criptomoeda'; 
}

interface Props {
  historico: HistoricoItem[];
  onClose: () => void;
}

// Helper para centralizar a lógica de exibição
const getTransactionDetails = (registro: HistoricoItem) => {
  const dataFormatada = formatarDataHoraBr(registro.data);

  switch (registro.tipo) {
    case 'deposito':
      return {
        text: `Depósito: ${formatCurrency(registro.valor)} em Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${dataFormatada}`,
        color: 'text-blue-600 font-semibold',
      };
    case 'compra':
      return {
        text: `Compra: ${formatCurrency(registro.valor)} em "${registro.nome}" no dia ${dataFormatada}`,
        color: 'text-red-600',
      };
    case 'venda':
      if (registro.categoria === 'rendaFixa') {
        return {
          text: `Resgate de "${registro.nome}": Bruto ${formatCurrency(registro.valorBruto ?? 0)}, Líquido ${formatCurrency(registro.valorLiquido ?? 0)} (IR: ${formatCurrency(registro.imposto ?? 0)}) no dia ${dataFormatada}`,
          color: 'text-green-700',
        };
      }
      return {
        text: `Venda: ${formatCurrency(registro.valor)} de "${registro.nome}" no dia ${dataFormatada}`,
        color: 'text-green-600',
      };
    case 'dividendo':
      return {
        text: `Dividendo: ${formatCurrency(registro.valor)} recebido de "${registro.nome}" no dia ${dataFormatada}`,
        color: 'text-purple-600',
      };
    case 'transferencia':
      return {
        text: `Transferência: ${formatCurrency(registro.valor)} para Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${dataFormatada}`,
        color: 'text-gray-700',
      };
    
    // ATUALIZADO: Lógica para exibir o débito de IR de forma detalhada
    case 'ir':
      const mesApelido = formatarMesAno(registro.data); // Usa a data do registro, que é 'YYYY-MM-01'
      const subtipoApelido = formatarSubtipo(registro.subtipo || '');
      return {
        text: `Débito de IR: ${formatCurrency(registro.valor)} sobre ${subtipoApelido} em ${mesApelido}, declarados no dia ${dataFormatada}`,
        color: 'text-orange-600 font-bold',
      };

    default:
      return { text: 'Operação desconhecida', color: 'text-gray-400' };
  }
};

export default function HistoricoModal({ historico, onClose }: Props) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  const historicoOrdenado = useMemo(() => {
    return [...historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [historico]);

  const exportarPDF = () => {
    const content = modalContentRef.current;
    if (!content) return;

    const hoje = new Date();
    const nomeArquivo = `Extrato_Transacoes_${hoje.toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;

    html2pdf().from(content).set({
      margin: 1,
      filename: nomeArquivo,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <div className="flex-1 text-center">
            <h2 className="text-2xl font-bold ml-10">Extrato de Transações</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition-colors">
            <XCircle size={28} />
          </button>
        </header>

        <main ref={modalContentRef} className="p-6 overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Extrato de Transações</h1>
            <p className="text-sm text-gray-500">
              Emitido em {new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          
          {historicoOrdenado.length > 0 ? (
            <ul className="space-y-3">
              {historicoOrdenado.map((registro, index) => {
                const { text, color } = getTransactionDetails(registro);
                return (
                  <li key={`${registro.data}-${index}`} className={`text-base font-medium ${color}`}>
                    {text}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-10">Nenhuma transação registrada.</p>
          )}
        </main>

        <footer className="p-4 border-t flex justify-end items-center gap-4 sticky bottom-0 bg-white">
           <Button onClick={exportarPDF} className="bg-gray-600 hover:bg-gray-700 text-white">
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar PDF
                </span>
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </footer>
      </div>
    </div>
  );
}