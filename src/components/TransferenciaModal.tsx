import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft, Lock, ShieldCheck, PiggyBank, Landmark, ArrowRight } from 'lucide-react';

interface TransferenciaModalProps {
  onClose: () => void;
  onConfirm: (valor: number, direcao: 'fixa-variavel' | 'variavel-fixa', senha: string) => void;
  saldoFixa: number;
  saldoVariavel: number;
}

export default function TransferenciaModal({ onClose, onConfirm, saldoFixa, saldoVariavel }: TransferenciaModalProps) {
  const [valor, setValor] = useState('');
  const [direcao, setDirecao] = useState<'fixa-variavel' | 'variavel-fixa'>('fixa-variavel');
  const [senha, setSenha] = useState('');

  const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;

  const saldoOrigemAtual = direcao === 'fixa-variavel' ? saldoFixa : saldoVariavel;
  const saldoDestinoAtual = direcao === 'fixa-variavel' ? saldoVariavel : saldoFixa;

  const saldoOrigemNovo = saldoOrigemAtual - valorNumerico;
  const saldoDestinoNovo = saldoDestinoAtual + valorNumerico;

  const handleConfirm = () => {
    if (valorNumerico > 0 && senha.length === 6) {
      if (valorNumerico > saldoOrigemAtual) {
        alert('Saldo insuficiente na conta de origem.');
        return;
      }
      onConfirm(valorNumerico, direcao, senha);
    } else {
      alert('Verifique o valor e a senha');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full h-full border border-slate-100 flex flex-col overflow-hidden"
    >
      {/* Standard Header Layout */}
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <ArrowRightLeft size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Transferência</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Movimentação Interna
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Disponível para Transferência</span>
            <span className="text-lg font-black text-blue-600 leading-none">
              {(saldoFixa + saldoVariavel).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

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
        <div className="w-full px-10 py-6 space-y-5">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 mx-auto transition-transform hover:scale-105 duration-500">
              <ArrowRightLeft size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Mova seu Capital</h3>
              <p className="text-slate-500 font-medium text-sm">Transfira saldo entre contas de forma instantânea.</p>
            </div>
          </div>

          <div className="space-y-10 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm w-full">
            <div className="space-y-8">
              {/* Fluxo de Transferência - Match Sizing */}
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-8">
                  {/* Conta Origem */}
                  <div
                    className={`p-6 rounded-[1.5rem] border-2 transition-all duration-500 ring-4 ring-offset-2 ${direcao === 'fixa-variavel' ? 'border-orange-200 bg-orange-50 ring-orange-100' : 'border-blue-200 bg-blue-50 ring-blue-100'
                      }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="px-4 py-1 bg-white rounded-full border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest shadow-sm mb-1">
                        CONTA DE ORIGEM
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${direcao === 'fixa-variavel' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                        {direcao === 'fixa-variavel' ? <PiggyBank size={24} /> : <Landmark size={24} />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {direcao === 'fixa-variavel' ? 'Renda Fixa' : 'Renda Variável'}
                        </p>
                        <p className="text-xs font-bold text-slate-400">{saldoOrigemAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Switch Button */}
                  <div className="flex justify-center flex-col items-center gap-3">
                    <button
                      onClick={() => setDirecao(direcao === 'fixa-variavel' ? 'variavel-fixa' : 'fixa-variavel')}
                      className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-90 transition-all group z-10"
                    >
                      <ArrowRightLeft size={20} className={`transition-transform duration-700 ${direcao === 'variavel-fixa' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="hidden md:block h-px w-full bg-slate-100 absolute left-0 right-0 top-1/2 -z-0"></div>
                  </div>

                  {/* Conta Destino */}
                  <div
                    className={`p-6 rounded-[1.5rem] border-2 transition-all duration-500 ring-4 ring-offset-2 ${direcao === 'fixa-variavel' ? 'border-blue-200 bg-blue-50 ring-blue-100' : 'border-orange-200 bg-orange-50 ring-orange-100'
                      }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="px-4 py-1 bg-white rounded-full border border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest shadow-sm mb-1">
                        CONTA DE DESTINO
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${direcao === 'fixa-variavel' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {direcao === 'fixa-variavel' ? <Landmark size={24} /> : <PiggyBank size={24} />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                          {direcao === 'fixa-variavel' ? 'Renda Variável' : 'Renda Fixa'}
                        </p>
                        <p className="text-xs font-bold text-slate-400">{saldoDestinoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de Inputs Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Repasse</label>
                  <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                    <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-400 font-black text-lg group-focus-within:text-blue-500 transition-colors shadow-sm">R$</div>
                    <input
                      type="text"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha (6 dígitos)</label>
                  <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                    <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-300 group-focus-within:text-blue-500 transition-colors shadow-sm">
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
              </div>
            </div>

            {/* Evolução Financeira Preview */}
            <div className="bg-slate-50/80 rounded-[1.5rem] border-2 border-slate-100 p-6 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Resumo da Progressão</h4>
                <div className="px-2.5 py-1 bg-blue-100 text-blue-600 text-[8px] font-black rounded uppercase">SIMULAÇÃO</div>
              </div>

              <div className="grid grid-cols-2 gap-6 relative">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Saída</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400 line-through shrink-0 text-opacity-70">{saldoOrigemAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <ArrowRight size={12} className="text-slate-300" />
                    <span className={`text-lg font-black ${saldoOrigemNovo < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {saldoOrigemNovo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Entrada</p>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm font-medium text-slate-400 line-through shrink-0 text-opacity-70">{saldoDestinoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <ArrowRight size={12} className="text-slate-300" />
                    <span className="text-lg font-black text-emerald-600">
                      {saldoDestinoNovo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!valor || senha.length !== 6 || valorNumerico <= 0}
                className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-3 shadow-xl active:scale-95 text-base"
              >
                <ShieldCheck size={20} />
                Confirmar Repasse
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
