import { motion } from 'framer-motion';
import { X, ShieldAlert, Receipt, TrendingUp, TrendingDown, MinusCircle, Calculator, PieChart, Landmark, Bitcoin } from 'lucide-react';
import { ResumoIR } from './ResumoIR';
import Button from './Button';

function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

function formatarSubtipo(subtipo: string): string {
  switch (subtipo.toLowerCase()) {
    case 'acao':
      return 'Ações';
    case 'fii':
      return 'FIIs';
    case 'criptomoeda':
      return 'Criptomoedas';
    default:
      return subtipo.toUpperCase();
  }
}

const getSubtipoIcon = (subtipo: string) => {
  switch (subtipo.toLowerCase()) {
    case 'acao': return <TrendingUp size={18} />;
    case 'fii': return <Landmark size={18} />;
    case 'criptomoeda': return <Bitcoin size={18} />;
    default: return <PieChart size={18} />;
  }
};

interface Props {
  resumosIR: ResumoIR[];
  onClose: () => void;
}

export default function ResumoIRModal({ resumosIR, onClose }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full min-h-full border border-slate-100 flex flex-col"
    >
       <header className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 shadow-sm">
              <ShieldAlert size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Consolidado Fiscal</h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Resumo de Apuração IR</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all font-bold"
          >
            <X size={24} />
          </button>
        </header>

        <main className="flex-1 p-10">
          {resumosIR.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 space-y-6 grayscale opacity-40">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200">
                <Receipt size={48} />
              </div>
              <div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Tudo em dia</p>
                 <p className="text-slate-500 font-medium tracking-tight mt-1">Nenhum imposto apurado para este período.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {resumosIR.map((r, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="group bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm text-slate-400 flex items-center justify-center group-hover:text-blue-500 transition-colors">
                        {getSubtipoIcon(r.subtipo)}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 tracking-tight text-lg">
                          {formatarMesAno(r.mes)}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatarSubtipo(r.subtipo)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vendido</p>
                        <p className="text-lg font-black text-slate-800 tracking-tighter">R$ {r.totalVendidoNoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Aquisição</p>
                        <p className="text-lg font-bold text-slate-500 tracking-tighter">R$ {r.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="space-y-3 px-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Resultado do Mês</span>
                        <span className={r.resultadoMesBruto >= 0 ? 'text-emerald-500 font-black' : 'text-red-500 font-black'}>
                          R$ {r.resultadoMesBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Prejuízo Compensado</span>
                        <span className="text-red-400 font-bold">
                          - R$ {r.prejuizoCompensado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="h-px bg-slate-200 my-4" />

                      <div className="flex justify-between items-center">
                        <span className="text-slate-800 font-black text-sm tracking-tight flex items-center gap-3">
                          <Calculator size={18} className="text-slate-300" />
                          Base de Cálculo
                        </span>
                        <span className="text-slate-800 font-black text-lg tracking-tighter">
                          R$ {r.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-[1.5rem] p-6 flex justify-between items-center shadow-xl shadow-slate-200">
                      <span className="text-white font-black text-xs uppercase tracking-[0.2em]">IR Devido</span>
                      <span className="text-white text-2xl font-black tracking-tighter">
                        R$ {r.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        <footer className="p-10 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-end sticky bottom-0 z-10 shrink-0">
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            Fechar Relatório
          </button>
        </footer>
      </motion.div>
  );
}