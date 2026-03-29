import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wallet, Lock, ArrowUpRight, ShieldCheck, Landmark, PiggyBank, RefreshCw } from 'lucide-react';
import Button from './Button';

interface DepositarModalProps {
  onClose: () => void;
  onConfirm: (valor: number, destino: 'fixa' | 'variavel', senha: string) => Promise<boolean>;
  saldoFixa: number;
  saldoVariavel: number;
}

export default function DepositarModal({ onClose, onConfirm, saldoFixa, saldoVariavel }: DepositarModalProps) {
  const [valor, setValor] = useState('');
  const [destino, setDestino] = useState<'fixa' | 'variavel'>('fixa');
  const [senha, setSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!isNaN(valorNumerico) && senha.length === 6) {
      setIsSubmitting(true);
      try {
        const sucesso = await onConfirm(valorNumerico, destino, senha);
        if (sucesso) {
          onClose();
        }
      } finally {
        setIsSubmitting(false);
      }
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
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <PiggyBank size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Novo Depósito</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Aporte Financeiro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Saldo em {destino === 'fixa' ? 'Fixa' : 'Variável'}</span>
            <span className="text-lg font-black text-blue-600 leading-none">
              {(destino === 'fixa' ? saldoFixa : saldoVariavel).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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
        <div className="w-full px-10 py-10 space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100 mx-auto transition-transform hover:scale-105 duration-500">
              <PiggyBank size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Prepare seu Aporte</h3>
              <p className="text-slate-500 font-medium text-sm">Defina o montante e a conta de destino para fortalecer seu patrimônio.</p>
            </div>
          </div>

          <div className="space-y-10 bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <div className="space-y-8">
              {/* Destino Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Para qual conta?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setDestino('fixa')}
                    className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all ${destino === 'fixa'
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destino === 'fixa' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <PiggyBank size={20} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight">Renda Fixa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestino('variavel')}
                    className={`flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all ${destino === 'variavel'
                        ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100'
                        : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200 shadow-sm'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${destino === 'variavel' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Landmark size={20} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight">Renda Variável</span>
                  </button>
                </div>
              </div>

              {/* Grid de Inputs Lado a Lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Aporte</label>
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

            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-[1.5rem] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !valor || senha.length !== 6}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-blue-100 active:scale-95"
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  <>
                    <ShieldCheck size={24} />
                    Confirmar Depósito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
