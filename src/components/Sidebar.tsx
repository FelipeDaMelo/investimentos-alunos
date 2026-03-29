import React, { useState } from 'react';
import {
  SquarePlus,
  CircleArrowUp,
  ArrowRightLeft,
  ReceiptText,
  Receipt,
  Trophy,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Trash2,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import FotoGrupoUploader from './FotoGrupoUploader';
import { LionIcon } from './LionIcon';

interface SidebarProps {
  login: string;
  fotoGrupo: string | null;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
  onTriggerDelete: () => void;
  // Triggers para os modais da MainPage
  onShowWizard?: () => void;
  onShowDepositar?: () => void;
  onShowTransferencia?: () => void;
  onShowHistorico?: () => void;
  onShowAtualizar?: () => void;
  onVerificarIR?: () => void;
  bloqueadoAtualizar?: boolean;
  activeModal?: 'wizard' | 'depositar' | 'transferir' | 'historico' | 'ir' | 'atualizar' | 'delete' | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  login,
  fotoGrupo,
  onLogout,
  onUploadConfirmado,
  onTriggerDelete,
  onShowWizard,
  onShowDepositar,
  onShowTransferencia,
  onShowHistorico,
  onShowAtualizar,
  onVerificarIR,
  bloqueadoAtualizar = false,
  activeModal = null,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  const handleAction = (action: string, callback?: () => void) => {
    if (isHome && callback) {
      callback();
    } else {
      navigate(`/?action=${action}`);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`bg-[#0f172a] text-slate-400 transition-all duration-300 shadow-2xl z-40 
        fixed bottom-0 left-0 w-full h-[72px] flex flex-row items-center px-2 overflow-x-auto custom-scrollbar border-t border-slate-800
        md:border-none md:relative md:h-screen md:sticky md:top-0 md:flex-col md:overflow-visible md:px-0
        ${collapsed ? 'md:w-20' : 'md:w-72'}`}
    >
      {/* Logo Area */}
      <div className={`hidden md:flex p-6 flex-col items-center ${collapsed ? 'px-2' : ''}`}>
        <img
          src="/logo.png"
          alt="SimulAção"
          className={`object-contain transition-all duration-300 ${collapsed ? 'w-10' : 'w-48'}`}
        />
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 flex flex-row items-center md:flex-col md:items-stretch md:py-4 md:px-4 md:space-y-1 md:overflow-visible h-full space-x-2 md:space-x-0">

        <Section title="Navegação" collapsed={collapsed}>
          <NavItem
            to="/"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={isActive('/') && !activeModal}
            collapsed={collapsed}
          />
          <NavItem
            to="/ranking"
            icon={<Trophy size={20} />}
            label="Rankings"
            active={isActive('/ranking')}
            collapsed={collapsed}
          />
          <NavItem
            to="/novidades"
            icon={<TrendingUp size={20} />}
            label="Novidades"
            active={isActive('/novidades')}
            collapsed={collapsed}
          />
        </Section>

        <Section title="Operações" collapsed={collapsed}>
          <ActionButton
            onClick={() => handleAction('wizard', onShowWizard)}
            icon={<SquarePlus size={20} />}
            label="Novo Ativo"
            active={activeModal === 'wizard'}
            collapsed={collapsed}
          />
          <ActionButton
            onClick={() => handleAction('depositar', onShowDepositar)}
            icon={<CircleArrowUp size={20} />}
            label="Depósito"
            active={activeModal === 'depositar'}
            collapsed={collapsed}
          />
          <ActionButton
            onClick={() => handleAction('transferir', onShowTransferencia)}
            icon={<ArrowRightLeft size={20} />}
            label="Transferir"
            active={activeModal === 'transferir'}
            collapsed={collapsed}
          />
          <ActionButton
            onClick={() => handleAction('historico', onShowHistorico)}
            icon={<ReceiptText size={20} />}
            label="Extrato"
            active={activeModal === 'historico'}
            collapsed={collapsed}
          />
        </Section>

        <Section title="Ferramentas" collapsed={collapsed}>
          <ActionButton
            onClick={() => handleAction('ir', onVerificarIR)}
            icon={<div className="-ml-1"><LionIcon size={28} /></div>}
            label="Imposto de Renda"
            active={activeModal === 'ir'}
            collapsed={collapsed}
          />
          <ActionButton
            onClick={() => handleAction('atualizar', onShowAtualizar)}
            icon={<RefreshCw size={20} />}
            label="Atualizar Valores"
            active={activeModal === 'atualizar'}
            disabled={bloqueadoAtualizar}
            collapsed={collapsed}
          />
        </Section>
      </nav>

      {/* Rodapé do Desenvolvedor */}
      {!collapsed && (
        <div className="hidden md:block px-6 py-4 text-center border-t border-slate-800/30">
          <p className="text-[10px] font-bold text-white uppercase tracking-widest opacity-50">
            Desenvolvido por<br />Prof. Dr. Felipe Damas Melo
          </p>
        </div>
      )}


      {/* Rodapé: Sair */}
      <div className="hidden md:block p-3 border-t border-slate-800/50 mt-auto">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all ${collapsed ? 'justify-center' : ''
            }`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Sair</span>}
        </button>
      </div>

      {/* Switcher de Colapsar (Apenas Desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex mx-4 mb-3 p-2.5 hover:bg-slate-800 rounded-2xl transition-colors items-center justify-center text-slate-500 hover:text-white"
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
};

// Componentes Auxiliares
const Section: React.FC<{ title: string; children: React.ReactNode; collapsed: boolean }> = ({ title, children, collapsed }) => (
  <div className="flex flex-row md:flex-col md:mb-4 shrink-0 border-r border-slate-800 md:border-none pr-2 mr-2 md:pr-0 md:mr-0 last:border-none">
    {!collapsed && <p className="hidden md:block px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{title}</p>}
    <div className="flex flex-row md:flex-col space-x-1 md:space-x-0 md:space-y-1">
      {children}
    </div>
  </div>
);

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; active: boolean; collapsed: boolean }> = ({
  to, icon, label, active, collapsed
}) => (
  <Link
    to={to}
    className={`flex items-center justify-center rounded-xl transition-all flex-col p-1.5 min-w-[64px] 
      md:min-w-0 md:flex-row md:justify-start md:p-2.5 md:gap-3
      ${active ? 'bg-blue-600 text-white shadow-lg md:shadow-blue-900/50' : 'hover:bg-slate-800 text-slate-400 hover:text-white'} 
      ${collapsed ? 'md:justify-center' : ''}`}
    title={collapsed ? label : ''}
  >
    <div className="shrink-0">{icon}</div>
    <span className={`text-[10px] font-bold mt-1 text-center leading-tight md:mt-0 md:text-sm md:font-medium md:text-left ${collapsed ? 'hidden md:hidden' : 'block'}`}>
      {label}
    </span>
  </Link>
);

const ActionButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  disabled?: boolean;
  active?: boolean;
  collapsed: boolean;
}> = ({
  onClick, icon, label, primary, disabled, active, collapsed
}) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center rounded-xl transition-all flex-col p-1.5 min-w-[64px]
        md:min-w-0 md:w-full md:flex-row md:justify-start md:p-2.5 md:gap-3
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'} 
        ${active ? 'bg-blue-600 text-white shadow-lg md:shadow-blue-900/50' 
                 : primary ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' 
                           : 'text-slate-400 hover:text-white'} 
        ${collapsed ? 'md:justify-center' : ''}`}
      title={collapsed ? label : ''}
    >
      <div className="shrink-0">{icon}</div>
      <span className={`text-[10px] font-bold mt-1 text-center leading-tight md:mt-0 md:text-sm md:font-medium md:text-left ${collapsed ? 'hidden md:hidden' : 'block'}`}>
        {label}
      </span>
    </button>
  );

export default Sidebar;
