import { useMemo, useRef } from 'react';
import { XCircle, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import Button from './Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  comentario?: string;
}

interface Props {
  historico: HistoricoItem[];
  onClose: () => void;
  nomeGrupo: string;
}

// Helper para centralizar a lógica de exibição
const getTransactionDetails = (registro: HistoricoItem) => {
  const dataFormatada = formatarDataHoraBr(registro.data);
  let details = { text: '', color: 'text-gray-800' };

  switch (registro.tipo) {
    case 'deposito':
      details = {
        text: `Depósito: ${formatCurrency(registro.valor)} em Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${dataFormatada}`,
        color: 'text-blue-600 font-semibold',
      };
      break;
    case 'compra':
      details = {
        text: `Compra: ${formatCurrency(registro.valor)} em "${registro.nome}" no dia ${dataFormatada}`,
        color: 'text-red-600',
      };
      break;
     case 'venda':
      if (registro.categoria === 'rendaFixa') {
        details = {
          text: `Resgate de "${registro.nome}": Bruto ${formatCurrency(registro.valorBruto ?? 0)}, Líquido ${formatCurrency(registro.valorLiquido ?? 0)} (IR: ${formatCurrency(registro.imposto ?? 0)}) no dia ${dataFormatada}`,
          color: 'text-green-700',
        };
      } else { // Para Renda Variável
        details = {
          text: `Venda: ${formatCurrency(registro.valor)} de "${registro.nome}" no dia ${dataFormatada}`,
          color: 'text-green-600',
        };
      }
      break; // <-- ADICIONADO
    case 'dividendo':
      details = {
        text: `Dividendo: ${formatCurrency(registro.valor)} recebido de "${registro.nome}" no dia ${dataFormatada}`,
        color: 'text-purple-600',
      };
      break;
    case 'transferencia':
      details = {
        text: `Transferência: ${formatCurrency(registro.valor)} para Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${dataFormatada}`,
        color: 'text-gray-700',
      };
    break;
    // ATUALIZADO: Lógica para exibir o débito de IR de forma detalhada
    case 'ir':
      const mesApelido = formatarMesAno(registro.data); // Usa a data do registro, que é 'YYYY-MM-01'
      const subtipoApelido = formatarSubtipo(registro.subtipo || '');
      details = {
        text: `Débito de IR: ${formatCurrency(registro.valor)} sobre ${subtipoApelido} em ${mesApelido}, declarados no dia ${dataFormatada}`,
        color: 'text-orange-600 font-bold',
      };
     break;
    default:
      details = { text: 'Operação desconhecida', color: 'text-gray-400' };
  }
  if (registro.comentario) {
    details.text += `\n"${registro.comentario}"`; // Adiciona o comentário em uma nova linha
  }

  return details;
};

export default function HistoricoModal({ historico, onClose, nomeGrupo }: Props) {

   const historicoOrdenado = useMemo(() => {
    return [...historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [historico]);

  // ✅ 3. SUBSTITUIÇÃO COMPLETA DA FUNÇÃO exportarPDF
  const exportarPDF = () => {
    try { // ✅ Adicionado try...catch para depuração
      const doc = new jsPDF();

      // ... (código do cabeçalho do PDF permanece o mesmo)
      doc.setFontSize(18);
      doc.text("Extrato de Transações", 14, 22);
      doc.setFontSize(14);
      doc.text(`Grupo: ${nomeGrupo}`, 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Emitido em ${new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 36);


      const tableColumn = ["Data", "Tipo", "Descrição", "Valor"];
      const tableRows: string[][] = [];

    // Preenchimento das linhas da tabela a partir do histórico
   historicoOrdenado.forEach(record => {
        const data = record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'N/A';
        let valor = 'N/A';
        if (record.tipo === 'venda' && record.categoria === 'rendaFixa' && record.valorLiquido !== undefined) {
            valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.valorLiquido);
        } else if (typeof record.valor === 'number') {
            valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.valor);
        }
        let descricao = record.nome || record.destino || '';
        if (record.comentario) {
            descricao += ` (${record.comentario})`;
        }
        tableRows.push([data, record.tipo || 'N/A', descricao, valor]);
      });


      // ✅ 2. Chame 'autoTable' diretamente, passando 'doc' como primeiro argumento
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
      });

      const nomeArquivo = `Extrato_${nomeGrupo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(nomeArquivo);

    } catch (error) {
        console.error("Erro ao gerar PDF do extrato:", error);
        alert("Ocorreu um erro ao gerar o PDF. Verifique o console para mais detalhes.");
    }
  };

  // O JSX para a visualização na tela permanece o mesmo
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

        {/* O 'ref' foi removido do <main> pois não é mais necessário */}
        <main className="p-6 overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Extrato de Transações</h1>
            <h2 className="text-lg font-semibold text-gray-600 mt-2">Grupo: {nomeGrupo}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Emitido em {new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
          
          {historicoOrdenado.length > 0 ? (
             <ul className="space-y-3">
              {historicoOrdenado.map((registro, index) => {
                const { text, color } = getTransactionDetails(registro);
                return (
                  <li key={`${registro.data}-${index}`} className={`text-base font-medium ${color} whitespace-pre-line`}>
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