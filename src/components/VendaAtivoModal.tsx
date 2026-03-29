import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Lock, MessageSquare, TrendingDown, Info, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { Ativo } from '../types/Ativo';
import Button from './Button';

interface VendaAtivoModalProps {
  ativo: Ativo;
  onConfirm: (quantidadeVendida: number, senha: string, comentario: string) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export default function VendaAtivoModal({ ativo, onConfirm, onClose, isSubmitting }: VendaAtivoModalProps) {
  const [quantidade, setQuantidade] = useState('');
  const [valorResgate, setValorResgate] = useState(ativo.tipo === 'rendaFixa' ? ativo.valorAtual.toFixed(2) : '');
  const [senha, setSenha] = useState('');
  const [comentario, setComentario] = useState('');

  const isRendaVariavel = ativo.tipo === 'rendaVariavel';

  const handleConfirm = () => {
    const quantidadeNumerica = parseFloat(quantidade.replace(',', '.'));
    const senhaValida = senha.length === 6;

    if (!senhaValida) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    if (isRendaVariavel) {
      const availableAmount = (ativo as any).quantidade;
      const tolerancia = 1e-9; 
      if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0 || quantidadeNumerica > availableAmount + tolerancia) {
        alert('Quantidade inválida.');
        return;
      }
      const quantidadeFinal = Math.min(quantidadeNumerica, availableAmount);
      onConfirm(quantidadeFinal, senha, comentario);
    } else {
      const valorNumerico = parseFloat(valorResgate.replace(',', '.'));
      if (isNaN(valorNumerico) || valorNumerico <= 0 || valorNumerico > ativo.valorAtual + 0.01) {
        alert('Valor de resgate inválido ou maior que o saldo atual.');
        return;
      }
      const valorFinal = Math.min(valorNumerico, ativo.valorAtual);
      onConfirm(valorFinal, senha, comentario);
    }
  };

  const getResumoResgate = () => {
    const valorNumerico = parseFloat(valorResgate.replace(',', '.'));
    const valorSolicitado = (isNaN(valorNumerico) || valorResgate === '') ? ativo.valorAtual : Math.min(valorNumerico, ativo.valorAtual);
    const proporcao = valorSolicitado / ativo.valorAtual;

    const hoje = new Date();
    const dataCompra = new Date(ativo.dataInvestimento);
    const dias = Math.floor((hoje.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24));
    
    const lucroTotal = ativo.valorAtual - ativo.valorInvestido;
    const lucroProporcional = lucroTotal * proporcao;
    
    const calcularAliquota = (d: number) => d <= 180 ? 0.225 : d <= 360 ? 0.20 : d <= 720 ? 0.175 : 0.15;
    const aliquota = calcularAliquota(dias);
    
    const imposto = lucroProporcional > 0 ? lucroProporcional * aliquota : 0;
    const valorLiquido = valorSolicitado - imposto;

    return { bruto: valorSolicitado, lucro: lucroProporcional, aliquota, imposto, valorLiquido, dias, proporcao };
  };

  const resumo = !isRendaVariavel ? getResumoResgate() : null;

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
             <TrendingDown size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
               {ativo.tipo === 'rendaFixa' ? 'Resgatar' : 'Vender'} Ativo
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {ativo.nome}
            </p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group"
          aria-label="Fechar"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="w-full px-10 py-6 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 ${ativo.tipo === 'rendaFixa' ? 'bg-blue-600' : 'bg-slate-900'} rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl mx-auto transition-transform hover:scale-105 duration-500`}>
               {ativo.tipo === 'rendaFixa' ? <ShieldCheck size={40} /> : <TrendingDown size={40} />}
            </div>
            <div className="space-y-2">
               <h3 className="text-4xl font-black text-slate-800 tracking-tight">
                  {ativo.tipo === 'rendaFixa' ? 'Liquidando Ativo' : 'Confirmar Venda'}
               </h3>
               <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
                  {ativo.tipo === 'rendaFixa' 
                    ? 'O resgate antecipado pode influenciar na rentabilidade final devido à tributação regressiva.' 
                    : 'A venda de ativos de renda variável requer confirmação de mercado instantânea.'}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Info Card */}
            <div className="space-y-6">
              {isRendaVariavel ? (
                <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <Wallet size={32} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo Atual</p>
                      <p className="text-3xl font-black text-slate-800">
                         {(ativo as any).quantidade.toFixed(6)} 
                         <span className="text-slate-400 text-sm ml-2">unid</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-50">
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cotação</span>
                        <p className="text-lg font-bold text-slate-700">{(ativo.valorAtual / (ativo as any).quantidade).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patrimônio</span>
                        <p className="text-lg font-black text-blue-600">{ativo.valorAtual.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                  <div className="relative space-y-6">
                    <div>
                      <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Resgate Líquido Estimado</p>
                      <h3 className="text-5xl font-black tracking-tighter">
                        {resumo?.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 pt-8 border-t border-white/20">
                      <div className="space-y-1">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest opacity-70">Bruto</p>
                        <p className="text-xl font-bold">{resumo?.bruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest opacity-70">Imposto ({resumo?.aliquota! * 100}%)</p>
                        <p className="text-xl font-bold text-blue-200">-{resumo?.imposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl border border-white/10">
                       <Info size={18} className="text-blue-200 shrink-0" />
                       <p className="text-xs font-medium text-blue-50 leading-relaxed">Cálculo auditado em {resumo?.dias} dias de permanência.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Column */}
            <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm h-full flex flex-col justify-center">
               {isRendaVariavel ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade a Vender</label>
                    <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-slate-800 transition-all bg-slate-50">
                      <input
                        type="text"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="0,000000"
                        className="flex-1 bg-transparent px-6 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                        autoFocus
                      />
                      <div className="w-16 shrink-0 flex items-center justify-center bg-white border-l-2 border-slate-100 text-slate-300 font-bold text-xs uppercase shadow-sm">
                        Unid
                      </div>
                    </div>
                  </div>
               ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor a Resgatar</label>
                    <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                      <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-400 shadow-sm font-black text-lg group-focus-within:text-blue-500 transition-colors">R$</div>
                      <input
                        type="text"
                        value={valorResgate}
                        onChange={(e) => setValorResgate(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
               )}

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha (6 dígitos)</label>
                <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-slate-800 transition-all bg-slate-50">
                  <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-300 group-focus-within:text-slate-800 transition-colors shadow-sm">
                    <Lock size={20} />
                  </div>
                  <input
                    type="password"
                    value={senha}
                    maxLength={6}
                    onChange={(e) => setSenha(e.target.value)}
                    className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none text-center tracking-[0.8em] text-lg"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Motivação da Operação (Opcional)</label>
                <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-slate-800 transition-all bg-slate-50">
                  <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-300 group-focus-within:text-slate-800 transition-colors shadow-sm">
                    <MessageSquare size={20} />
                  </div>
                  <input
                    type="text"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none text-lg"
                    placeholder="Ex: Realização de lucro ou ajuste..."
                  />
                </div>
              </div>

               <div className="pt-4 flex gap-4">
                <button
                   onClick={onClose}
                   className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-[1.5rem] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting || (isRendaVariavel && !quantidade) || (!isRendaVariavel && !valorResgate) || senha.length !== 6}
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl active:scale-95"
                >
                  {isSubmitting ? (
                    <RefreshCw className="animate-spin" size={24} />
                  ) : (
                    <>
                      <ShieldCheck size={24} />
                      {ativo.tipo === 'rendaFixa' ? 'Confirmar Resgate' : 'Confirmar Venda'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
