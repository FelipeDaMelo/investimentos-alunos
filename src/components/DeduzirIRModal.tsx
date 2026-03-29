import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ShieldAlert, Calculator, Lock, CheckCircle2 } from 'lucide-react';
import { ResumoIR } from './ResumoIR';
import Button from './Button';
import { LionIcon } from './LionIcon';
import { mesEncerrado } from '../utils/mesEncerrado';

interface Props {
  resumosIR: ResumoIR[];
  saldoVariavel: number;
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

// Função para formatar o mês, ex: "Junho de 2025"
function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

// Função para formatar o subtipo, ex: "Ações"
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

export default function DeduzirIRModal({ resumosIR, saldoVariavel, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');

  const resumosValidos = resumosIR.filter(r => mesEncerrado(r.mes) && r.imposto > 0);
  const resumosFuturos = resumosIR.filter(r => !mesEncerrado(r.mes) && r.imposto > 0);
  
  const totalDevido = resumosValidos.reduce((acc, r) => acc + r.imposto, 0);
  const podePagar = saldoVariavel >= totalDevido && resumosValidos.length > 0;

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    onConfirm(senha);
  };

  let aviso = '';
  if (resumosFuturos.length > 0) {
    const nomesMeses = resumosFuturos.map(r => formatarMesAno(r.mes)).join(', ');
    aviso = `Você tem impostos em aberto para o mês de ${nomesMeses}. Os valores estarão disponíveis para declaração após o encerramento do mês.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full h-full border border-slate-100 flex flex-col overflow-hidden"
    >
      {/* Standard Header Layout */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100 overflow-hidden">
            <LionIcon size={36} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Dedução de Imposto</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Compensação & Declaração
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
        <div className="w-full px-10 py-10 space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-red-100 mx-auto transition-transform hover:scale-105 duration-500 overflow-hidden">
              <LionIcon size={56} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Consolidação Fiscal</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                {resumosValidos.length > 0
                  ? `Foram identificados ${resumosValidos.length} períodos aguardando dedução.`
                  : 'Sua situação fiscal está regularizada.'}
              </p>
            </div>
          </div>

          {aviso && (
            <div className="p-6 bg-orange-50 rounded-[2rem] border-2 border-orange-100 flex items-start gap-4 shadow-sm animate-pulse-subtle">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-orange-800 uppercase tracking-widest">Informação Importante</p>
                <p className="text-sm text-orange-700 font-medium leading-relaxed">
                  {aviso}
                </p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-10 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm w-full">
            {resumosValidos.length > 0 ? (
              <>
                <div className="space-y-4">
                  {resumosValidos.map((r, i) => (
                    <div key={i} className="bg-slate-50/50 rounded-[1.5rem] p-6 border-2 border-slate-100 shadow-sm space-y-4 group hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 tracking-tight">{formatarMesAno(r.mes)}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatarSubtipo(r.subtipo)}</p>
                        </div>
                        <div className="bg-blue-600 rounded-xl px-4 py-2 text-white font-black text-xs shadow-lg shadow-blue-100">
                          R$ {r.imposto.toFixed(2)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <span>Venda:</span>
                          <span className="text-slate-600 text-xs sm:text-sm font-black">R$ {r.totalVendidoNoMes.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                          <span>Resultado:</span>
                          <span className={`text-xs sm:text-sm font-black ${r.resultadoMesBruto >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            R$ {r.resultadoMesBruto.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!podePagar && resumosValidos.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4">
                    <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-black text-red-800 uppercase tracking-widest">Saldo Insuficiente</p>
                      <p className="text-[11px] text-red-700 font-medium">
                        Você possui <strong>R$ {saldoVariavel.toFixed(2)}</strong> em caixa na Renda Variável, mas a DARF totaliza <strong>R$ {totalDevido.toFixed(2)}</strong>. 
                        Venda alguns ativos para gerar caixa antes de recolher o imposto.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100 items-end">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha (6 dígitos)</label>
                    <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                      <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-300 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors shadow-sm">
                        <Lock size={20} />
                      </div>
                      <input
                        type="password"
                        value={senha}
                        maxLength={6}
                        onChange={(e) => setSenha(e.target.value)}
                        className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none text-center tracking-[0.8em] text-lg"
                        placeholder="••••••"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={senha.length !== 6 || !podePagar}
                    className="h-[68px] w-full bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                  >
                    Confirmar Dedução Total
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white p-20 rounded-[3rem] border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6 grayscale opacity-40">
                <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-300">
                  <CheckCircle2 size={48} />
                </div>
                <div>
                  <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Situação Regular</p>
                  <p className="text-slate-500 font-medium tracking-tight mt-1">
                    Nenhum tributo pendente de liquidação no momento.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black transition-all"
                >
                  Voltar ao Painel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}