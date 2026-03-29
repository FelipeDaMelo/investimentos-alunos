import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Download, History, Calendar, ArrowUpRight, ArrowDownLeft, MinusCircle, PlusCircle, PieChart, ReceiptText, Info, ArrowRightLeft } from 'lucide-react';
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

function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

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

// Tipos
interface HistoricoItem {
  tipo: 'deposito' | 'compra' | 'venda' | 'dividendo' | 'transferencia' | 'ir';
  valor: number;
  destino?: 'fixa' | 'variavel';
  nome?: string;
  data: string;
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

const getTransactionInfo = (registro: HistoricoItem) => {
  switch (registro.tipo) {
    case 'deposito':
      return {
        label: 'Depósito',
        icon: <PlusCircle size={18} />,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50',
        desc: `Saldo Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'}`
      };
    case 'compra':
      return {
        label: 'Compra',
        icon: <ArrowDownLeft size={18} />,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        desc: registro.nome
      };
    case 'venda':
      return {
        label: registro.categoria === 'rendaFixa' ? 'Resgate' : 'Venda',
        icon: <ArrowUpRight size={18} />,
        color: 'text-orange-500',
        bg: 'bg-orange-50',
        desc: registro.nome
      };
    case 'dividendo':
      return {
        label: 'Dividendo',
        icon: <PieChart size={18} />,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
        desc: registro.nome
      };
    case 'transferencia':
      return {
        label: 'Transferência',
        icon: <ArrowRightLeft size={18} />,
        color: 'text-slate-500',
        bg: 'bg-slate-50',
        desc: `Para Renda ${registro.destino === 'fixa' ? 'Fixa' : 'Variável'}`
      };
    case 'ir':
      return {
        label: 'Imposto (IR)',
        icon: <MinusCircle size={18} />,
        color: 'text-red-500',
        bg: 'bg-red-50',
        desc: `${formatarSubtipo(registro.subtipo || '')} (${formatarMesAno(registro.data)})`
      };
    default:
      return {
        label: 'Operação',
        icon: <ReceiptText size={18} />,
        color: 'text-slate-400',
        bg: 'bg-slate-50',
        desc: 'N/D'
      };
  }
};

export default function HistoricoModal({ historico, onClose, nomeGrupo }: Props) {
  const historicoOrdenado = useMemo(() => {
    return [...historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [historico]);

  const exportarPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Extrato de Transações", 14, 22);
      doc.setFontSize(14);
      doc.text(`Grupo: ${nomeGrupo}`, 14, 30);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Emitido em ${new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 36);

      const tableColumn = ["Data", "Tipo", "Descrição", "Valor"];
      const tableRows: string[][] = [];

      historicoOrdenado.forEach(record => {
        const data = record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'N/A';
        let valor = 'N/A';
        if (record.tipo === 'venda' && record.categoria === 'rendaFixa' && record.valorLiquido !== undefined) {
          valor = formatCurrency(record.valorLiquido);
        } else if (typeof record.valor === 'number') {
          valor = formatCurrency(record.valor);
        }
        let descricao = record.nome || record.destino || '';
        if (record.comentario) {
          descricao += ` (${record.comentario})`;
        }
        tableRows.push([data, record.tipo || 'N/A', descricao, valor]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
      });

      const nomeArquivo = `Extrato_${nomeGrupo}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
      doc.save(nomeArquivo);
    } catch (error) {
      console.error("Erro ao gerar PDF do extrato:", error);
      alert("Ocorreu um erro ao gerar o PDF.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full h-full border border-slate-100 flex flex-col overflow-hidden"
    >
      {/* Standard Header Layout */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Extrato Detalhado</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {nomeGrupo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={exportarPDF}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm text-xs"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Relatório PDF</span>
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group"
            aria-label="Fechar"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="w-full px-10 py-10 space-y-10">
          {/* Quick Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Operações</p>
              <p className="text-3xl font-black text-slate-800">{historico.length}</p>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
                <div className="h-full bg-blue-500" style={{ width: '30%' }} />
                <div className="h-full bg-orange-500" style={{ width: '30%' }} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Maior Entrada</p>
              <p className="text-3xl font-black text-emerald-500">
                {formatCurrency(Math.max(...historico.filter(h => ['deposito', 'venda', 'dividendo'].includes(h.tipo)).map(h => h.valor), 0))}
              </p>
              <p className="text-[10px] font-bold text-slate-400 leading-none">Recorde histórico de aporte</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Última Atividade</p>
              <p className="text-3xl font-black text-slate-800">
                {historicoOrdenado[0] ? formatarDataHoraBr(historicoOrdenado[0].data).split('/')[0] + '/' + formatarDataHoraBr(historicoOrdenado[0].data).split('/')[1] : 'N/A'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 leading-none">Recém sincronizado</p>
            </div>
          </div>

          {/* Transações */}
          <div className="space-y-4">
            {historicoOrdenado.length > 0 ? (
              <div className="space-y-4">
                {historicoOrdenado.map((registro, index) => {
                  const info = getTransactionInfo(registro);
                  const isPositive = ['deposito', 'venda', 'dividendo'].includes(registro.tipo);

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      key={`${registro.data}-${index}`}
                      className="group"
                    >
                      <div className="flex items-center gap-6 p-5 rounded-[2rem] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all">
                        <div className={`w-16 h-16 ${info.bg} ${info.color} rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                          {info.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <div>
                              <p className="text-base font-bold text-slate-800 truncate">{info.desc || info.label}</p>
                              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                <span className="flex items-center gap-1.5 rounded-lg">
                                  <Calendar size={12} className="text-slate-300" />
                                  {formatarDataHoraBr(registro.data)}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-slate-400">
                                  {info.label}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className={`text-xl font-black tracking-tighter ${isPositive ? 'text-emerald-500' : 'text-slate-800'}`}>
                                {isPositive ? '+' : '-'} {formatCurrency(registro.tipo === 'venda' && registro.categoria === 'rendaFixa' ? (registro.valorLiquido ?? 0) : registro.valor)}
                              </p>
                              {registro.tipo === 'venda' && registro.categoria === 'rendaFixa' && typeof registro.imposto === 'number' && registro.imposto > 0 && (
                                <p className="text-[10px] font-bold text-slate-400">IR: {formatCurrency(registro.imposto)}</p>
                              )}
                            </div>
                          </div>

                          {registro.comentario && (
                            <div className="mt-3 relative">
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-100 rounded-full" />
                              <p className="pl-4 text-xs text-slate-500 font-medium italic leading-relaxed">
                                {registro.comentario}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20 grayscale opacity-40">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300">
                  <History size={48} />
                </div>
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Sem Histórico</p>
                  <p className="text-slate-500 font-medium tracking-tight mt-1">Nenhuma operação registrada até o momento.</p>
                </div>
              </div>
            )}
          </div>

          <footer className="py-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Sincronizado com a blockchain financeira • {historico.length} registros
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Fechar Extrato
            </button>
          </footer>
        </div>
      </div>
    </motion.div>
  );
}