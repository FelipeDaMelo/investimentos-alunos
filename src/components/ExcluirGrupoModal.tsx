import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert, Trash2, Lock } from 'lucide-react';
import Button from './Button';

interface Props {
  nomeGrupo: string;
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function ExcluirGrupoModal({ nomeGrupo, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isConfirmEnabled = confirmText === nomeGrupo;

  const handleConfirm = () => {
    if (!isConfirmEnabled) {
      alert(`Você precisa digitar "${nomeGrupo}" para confirmar.`);
      return;
    }
    if (senha.length !== 6) {
      alert('A senha de 6 dígitos é obrigatória.');
      return;
    }
    onConfirm(senha);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white shadow-2xl w-full min-h-full border border-red-50 flex flex-col justify-center"
    >
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-[30px] flex items-center justify-center text-red-500 mx-auto shadow-sm">
            <ShieldAlert size={40} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Zona de Risco</h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              Esta ação é <span className="text-red-600 font-bold">permanente e irreversível</span>. Todos os dados do grupo 
              <span className="text-slate-800 font-black"> "{nomeGrupo}"</span> serão apagados.
            </p>
          </div>

          <div className="space-y-6 text-left mt-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Confirme o nome do grupo: <span className="text-red-500">{nomeGrupo}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-bold text-slate-800 focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all placeholder:text-slate-200"
                placeholder={nomeGrupo}
                autoFocus
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Senha Mestra (6 dígitos)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  className="w-full p-5 pl-14 bg-slate-50 border-2 border-slate-100 rounded-[24px] font-black text-xl tracking-[0.5em] focus:border-red-500 focus:ring-4 focus:ring-red-50 transition-all placeholder:tracking-normal placeholder:text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={`w-full py-5 rounded-[24px] font-black tracking-tight transition-all flex items-center justify-center gap-3 shadow-xl ${
              !isConfirmEnabled 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
            }`}
          >
            <Trash2 size={20} />
            Excluir Permanentemente
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            Cancelar e Voltar
          </button>
        </footer>
      </motion.div>
  );
}