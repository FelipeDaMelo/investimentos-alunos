// Caminho: src/components/Ranking/AdminPasswordModal.tsx

import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface Props {
  title: string;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export default function AdminPasswordModal({ title, onClose, onConfirm }: Props) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up flex flex-col border border-slate-100">
        
        <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{title}</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Autenticação Necessária</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <main className="p-8">
          <form id="admin-password-form" onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-medium text-slate-600 mb-6">
              Para prosseguir com esta ação, por favor, insira a senha de administrador.
            </p>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Senha do Administrador</label>
              <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-colors bg-slate-50">
                <div className="w-14 flex items-center justify-center bg-slate-100 text-slate-400 border-r-2 border-slate-100 group-focus-within:text-blue-500 group-focus-within:border-blue-100 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent px-4 py-4 text-slate-800 font-bold focus:outline-none tracking-[0.2em]"
                  autoFocus
                />
              </div>
            </div>
          </form>
        </main>

        <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-4 bg-white text-slate-500 border-2 border-slate-200 rounded-2xl font-black tracking-tight hover:bg-slate-100 transition-all active:scale-95"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="admin-password-form"
            className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
            disabled={!password}
          >
            Confirmar
          </button>
        </footer>

      </div>
    </div>
  );
}
