import React, { useState } from 'react';
import FotoGrupoUploader from './FotoGrupoUploader';
import { LogOut, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import Button from './Button';

interface HeaderProps {
  login: string;
  nomeGrupo: string;
  fotoGrupo: string | null;
  valorTotalAtual: number;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
  onTriggerDelete: () => void;
  formatCurrency: (value: number) => string;
}

const Header: React.FC<HeaderProps> = ({
  login,
  nomeGrupo,
  fotoGrupo,
  valorTotalAtual,
  onLogout,
  onUploadConfirmado,
  onTriggerDelete,
  formatCurrency
}) => {
  const [showValues, setShowValues] = useState(true);

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 w-full animate-fade-in">
      
      {/* Lado Esquerdo: Perfil e Saudação */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <FotoGrupoUploader 
            login={login} 
            fotoUrlAtual={fotoGrupo || undefined}
            onConfirmUpload={onUploadConfirmado}
            onTriggerDelete={onTriggerDelete}
            size="medium"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Olá, {nomeGrupo}! 👋
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Acompanhe sua evolução nos investimentos
          </p>
        </div>
      </div>

      {/* Lado Direito: Patrimônio */}
      <div className="flex items-center gap-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 min-w-[320px] shadow-2xl border border-slate-800 flex flex-col items-center relative overflow-hidden group">
          {/* Brilho decorativo */}
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
          
          <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-3 z-10">
            <span>Patrimônio Total</span>
            <button 
              onClick={() => setShowValues(!showValues)}
              className="hover:text-white transition-colors"
            >
              {showValues ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          <div className="text-4xl font-extrabold tracking-tight z-10 min-h-[44px] text-white">
            {showValues ? formatCurrency(valorTotalAtual) : '••••••••'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
