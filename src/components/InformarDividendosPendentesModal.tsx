import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, HandCoins, ExternalLink, Calendar, Coins, Lock, Info, Landmark, TrendingUp, Building2, CheckCircle2 } from 'lucide-react';

export interface PendenciaDividendo {
  mesApuracao: string;
  quantidadeNaqueleMes: number;
}

export interface DividendoPreenchido {
  mesApuracao: string;
  valorPorCota: number;
}

interface Props {
  nomeFII: string;
  tickerFII: string;
  pendencias: PendenciaDividendo[];
  onClose: () => void;
  onConfirm: (dividendos: DividendoPreenchido[], senha: string) => void;
}

function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) < 1e-9) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function InformarDividendosPendentesModal({
  nomeFII,
  tickerFII,
  pendencias,
  onConfirm,
  onClose,
}: Props) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [senha, setSenha] = useState('');

  const handleValorChange = (mes: string, valor: string) => {
    setValores(prev => ({ ...prev, [mes]: valor }));
  };

  const creditoTotal = useMemo(() => {
    return pendencias.reduce((total, p) => {
      const valorDigitado = parseFloat((valores[p.mesApuracao] || '0').replace(',', '.'));
      const valorMes = !isNaN(valorDigitado) ? valorDigitado * p.quantidadeNaqueleMes : 0;
      return total + valorMes;
    }, 0);
  }, [valores, pendencias]);

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    const dividendosPreenchidos: DividendoPreenchido[] = [];
    for (const pendencia of pendencias) {
      const valorString = valores[pendencia.mesApuracao];
      if (!valorString) {
        alert(`Por favor, preencha o valor do dividendo para ${formatarMesAno(pendencia.mesApuracao)}.`);
        return;
      }
      const valorFloat = parseFloat(valorString.replace(',', '.'));
      if (isNaN(valorFloat) || valorFloat < 0) {
        alert(`O valor digitado para ${formatarMesAno(pendencia.mesApuracao)} é inválido.`);
        return;
      }
      dividendosPreenchidos.push({
        mesApuracao: pendencia.mesApuracao,
        valorPorCota: valorFloat,
      });
    }
    onConfirm(dividendosPreenchidos, senha);
  };

  if (pendencias.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] p-12 shadow-2xl w-full max-w-md text-center border border-slate-100"
      >
        <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Rendimentos em Dia!</h3>
        <p className="text-slate-500 font-medium mb-10 leading-relaxed">Não encontramos dividendos pendentes no sistema para o ativo <strong>{nomeFII}</strong>.</p>
        <button 
          onClick={onClose} 
          className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black tracking-tight hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
        >
          Continuar Navegando
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full min-h-full flex flex-col border border-slate-100"
    >
      <header className="px-8 py-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-purple-200">
            <Landmark size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Lançamento de Proventos</h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">{nomeFII}</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all font-bold"
        >
          <X size={24} />
        </button>
      </header>
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Lado Esquerdo: Ativo Info & Resumo (Fixo) */}
        <aside className="w-full lg:w-[320px] xl:w-96 border-r border-slate-100 p-6 bg-slate-50/30 flex flex-col justify-between shrink-0 lg:sticky lg:top-24 self-start h-max z-0">
          <div className="space-y-6">
             <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors" />
                <div className="relative z-10 space-y-3">
                   <p className="text-4xl font-black text-slate-800 tracking-tighter">{tickerFII}</p>
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{nomeFII}</p>
                   <div className="pt-4 flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Rendimento Pendente</span>
                   </div>
                </div>
             </div>

             <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ferramental de Apoio</p>
                <a
                  href={`https://statusinvest.com.br/fundos-imobiliarios/${tickerFII.toLowerCase().replace('.sa', '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all group"
                >
                  <div className="space-y-1">
                     <p className="text-sm font-black">Status Invest</p>
                     <p className="text-[10px] font-bold text-blue-100 opacity-80 uppercase tracking-widest">Consultar Edital</p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:rotate-45 transition-transform">
                     <ExternalLink size={20} />
                  </div>
                </a>
             </div>

             <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-2 mt-4">
                <div className="flex items-center gap-3">
                   <Info size={16} className="text-slate-300" />
                   <p className="text-[10px) font-black text-slate-400 uppercase tracking-widest">Por que informar?</p>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Manter o histórico de proventos atualizado melhora a precisão do seu <strong>Yield on Cost</strong> e do cálculo de rentabilidade real.
                </p>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 mt-6 space-y-3 shadow-xl">
             <div className="flex items-center gap-3 text-emerald-400">
                <Coins size={18} />
                <span className="text-[10px) font-black uppercase tracking-widest">Crédito Estimado</span>
             </div>
             <div className="space-y-1">
                <p className="text-white text-2xl font-black tracking-tighter">{formatCurrency(creditoTotal)}</p>
                <p className="text-slate-400 text-[10px) font-bold uppercase tracking-widest">Total dos meses selecionados</p>
             </div>
          </div>
        </aside>

        {/* Lado Direito: Listagem & Formulário (Scrollable) */}
        <div className="flex-1 flex flex-col bg-white">
           <div className="flex-1 p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {pendencias.map((p, i) => {
                   const valorDigitado = parseFloat((valores[p.mesApuracao] || '0').replace(',', '.'));
                   const valorTotalMes = !isNaN(valorDigitado) ? valorDigitado * p.quantidadeNaqueleMes : 0;

                   return (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       key={p.mesApuracao} 
                       className="group bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-100/50 transition-all space-y-5"
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                              <Calendar size={20} />
                           </div>
                           <h3 className="font-black text-slate-800 tracking-tight text-lg">{formatarMesAno(p.mesApuracao)}</h3>
                         </div>
                         <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {p.quantidadeNaqueleMes.toFixed(0)} cotas
                         </div>
                       </div>

                       <div className="space-y-4">
                         <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                           <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-400 font-black text-lg group-focus-within:text-blue-500 transition-colors shadow-sm">R$</div>
                           <input
                             id={`cota-${p.mesApuracao}`}
                             type="text"
                             inputMode="decimal"
                             placeholder="Valor por cota (0,00)"
                             value={valores[p.mesApuracao] || ''}
                             onChange={(e) => handleValorChange(p.mesApuracao, e.target.value)}
                             className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                             autoFocus={i === 0}
                           />
                         </div>

                         <div className="flex justify-between items-center text-emerald-600 bg-emerald-50/50 px-6 py-4 rounded-2xl border border-emerald-100/30">
                            <span className="text-[10px] font-black uppercase tracking-widest">Rendimento Total</span>
                            <span className="text-xl font-black tracking-tighter">
                              {formatCurrency(valorTotalMes)}
                            </span>
                         </div>
                       </div>
                     </motion.div>
                   );
                 })}
              </div>
           </div>

           <footer className="px-6 lg:px-8 pt-6 pb-12 lg:pb-16 bg-slate-50 border-t border-slate-100 shrink-0">
             <div className="flex flex-col md:flex-row gap-5 items-end">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Confirmação de Identidade (6 dígitos)</label>
                  <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                    <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-300 group-focus-within:text-blue-500 transition-colors shadow-sm">
                      <Lock size={20} />
                    </div>
                    <input 
                      type="password" 
                      value={senha} 
                      maxLength={6} 
                      onChange={(e) => setSenha(e.target.value)} 
                      placeholder="••••••" 
                      className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none text-center tracking-[0.8em] text-lg placeholder:tracking-normal placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleConfirm} 
                  disabled={senha.length !== 6 || creditoTotal <= 0}
                  className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black tracking-tight hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 text-lg"
                >
                  Confirmar Recebimento
                </button>
             </div>
           </footer>
        </div>
      </main>
    </motion.div>
  );
}