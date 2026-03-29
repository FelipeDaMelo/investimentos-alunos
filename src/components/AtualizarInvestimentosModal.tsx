import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, ShieldCheck, Lock, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function AtualizarInvestimentosModal({ onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    onConfirm(senha);
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
            <RefreshCw size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Sincronização com a B3</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Atualizar os valores dos seus investimentos
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
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100 mx-auto transition-transform hover:scale-105 duration-500">
              <RefreshCw size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-slate-800 tracking-tight">Atualizar Valores</h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
                Atualize os preços de fechamento e cotações em tempo real para refletir seu patrimônio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Rules Card */}
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4 text-blue-600">
                <Clock size={24} />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Protocolos de Sincronia</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">Intervalo de segurança de <strong>60 segundos</strong> entre as execuções para evitar sobrecarga.</p>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">Dados de <strong>Renda Fixa</strong> atualizados em ciclos de <strong>24 horas</strong> com base em taxas DI.</p>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 font-bold leading-relaxed">Operação consulta múltiplos oráculos de preço para garantir precisão total.</p>
                </div>
              </div>
            </div>

            {/* Validation Form */}
            <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm flex flex-col justify-center space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha (6 dígitos)</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="password"
                    value={senha}
                    maxLength={6}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] pl-16 pr-6 py-6 text-slate-700 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none text-center tracking-[0.8em] text-2xl"
                    placeholder="••••••"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-50 rounded-[1.5rem] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={senha.length !== 6}
                  className="flex-[2] py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl shadow-blue-100 active:scale-95"
                >
                  <RefreshCw size={24} />
                  Sincronizar Carteira
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
