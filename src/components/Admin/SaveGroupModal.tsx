import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, FolderPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: (nome: string) => void;
}

export default function SaveGroupModal({ onClose, onConfirm }: Props) {
  const [nome, setNome] = useState('');

  const handleConfirm = () => {
    if (nome.trim().length === 0) {
      alert('O nome do grupo não pode ser vazio.');
      return;
    }
    onConfirm(nome.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 flex flex-col overflow-hidden"
      >
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <FolderPlus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Salvar Monitoramento</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </header>

        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <p className="text-slate-500 font-medium">
              Dê um nome para este grupo de acompanhamento (ex: <span className="font-bold text-slate-700">Semestre 2024.1</span>).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Nome do Grupo
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-700 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
              placeholder="Digite o nome..."
              autoFocus
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={nome.trim().length === 0}
              className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-95"
            >
              <Save size={20} />
              Salvar Grupo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
