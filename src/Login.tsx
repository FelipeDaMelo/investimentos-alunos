import React, { useState } from 'react';
import useMoneyInput from './hooks/useMoneyInput';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Power, UserRoundCheck, Trophy, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, Briefcase } from 'lucide-react';
import TutorialModal from './TutorialModal';
import { Link, useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string, senha: string, fotoGrupo: string | null) => void;
}

type ViewState = 'menu' | 'platform' | 'create' | 'login';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { value: valorInvestido, displayValue, handleChange } = useMoneyInput(0);
  const navigate = useNavigate();

  const [view, setView] = useState<ViewState>('menu');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [senha, setSenha] = useState('');
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

  const nomeGrupoNormalizado = nomeGrupo.trim().toUpperCase();

  const verificarGrupo = async () => {
    if (!nomeGrupoNormalizado) {
      setErro('Informe o nome do grupo');
      return;
    }

    setVerificando(true);
    setErro('');
    try {
      const docRef = doc(db, 'usuarios', nomeGrupoNormalizado);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        onLogin(
          data.valorInvestido,
          data.porcentagemFixa,
          data.porcentagemVariavel,
          nomeGrupoNormalizado,
          senha,
          data.fotoGrupo || null
        );
      } else {
        setErro('Grupo não encontrado. Verifique o nome digitado.');
      }
    } catch (err) {
      setErro('Erro ao verificar grupo. Tente novamente.');
      console.error(err);
    } finally {
      setVerificando(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fixoNum = parseFloat(fixo);
    const variavelNum = parseFloat(variavel);

    if (isNaN(fixoNum) || isNaN(variavelNum)) {
      setErro('Insira valores numéricos válidos para os percentuais.');
      return;
    }
    if (fixoNum + variavelNum !== 100) {
      setErro('A soma das porcentagens (Fixa + Variável) deve ser exatamente 100%.');
      return;
    }
    if (valorInvestido <= 0) {
      setErro('O capital inicial deve ser positivo.');
      return;
    }
    if (senha.length !== 6) {
      setErro('A senha deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    setVerificando(true);
    setErro('');
    try {
      const docRef = doc(db, 'usuarios', nomeGrupoNormalizado);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setErro('Este nome de grupo já está em uso.');
        setVerificando(false);
        return;
      }

      const dataAtual = new Date().toISOString();
      const hoje = dataAtual.split('T')[0];

      await setDoc(docRef, {
        valorInvestido,
        porcentagemFixa: fixoNum,
        porcentagemVariavel: variavelNum,
        ativos: [],
        senha,
        historico: [
          { tipo: 'deposito', valor: valorInvestido * (fixoNum / 100), destino: 'fixa', data: dataAtual, descricao: 'Aporte Inicial' },
          { tipo: 'deposito', valor: valorInvestido * (variavelNum / 100), destino: 'variavel', data: dataAtual, descricao: 'Aporte Inicial' }
        ],
        totalCotas: valorInvestido,
        valorCotaPorDia: { [hoje]: 1 }
      });

      onLogin(valorInvestido, fixoNum, variavelNum, nomeGrupoNormalizado, senha, null);
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao criar o usuário. Tente novamente.');
    } finally {
      setVerificando(false);
    }
  };

  const handleAdminAccess = () => {
    onLogin(0, 0, 0, 'ADMINISTRATOR_SYSTEM_OVERRIDE', '', null);
    navigate('/admin');
  };

  const handleDemoAccess = async () => {
    setVerificando(true);
    const demoId = `VISITANTE_${Math.floor(Math.random() * 90000) + 10000}`;
    const dataAtual = new Date().toISOString();
    const hoje = dataAtual.split('T')[0];

    try {
      await setDoc(doc(db, 'usuarios', demoId), {
        valorInvestido: 100000,
        porcentagemFixa: 50,
        porcentagemVariavel: 50,
        ativos: [],
        senha: 'DEMO',
        isDemo: true,
        historico: [
          { tipo: 'deposito', valor: 50000, destino: 'fixa', data: dataAtual, descricao: 'Depósito Inicial (Visitante)' },
          { tipo: 'deposito', valor: 50000, destino: 'variavel', data: dataAtual, descricao: 'Depósito Inicial (Visitante)' }
        ],
        totalCotas: 100000,
        valorCotaPorDia: { [hoje]: 1 }
      });

      onLogin(100000, 50, 50, demoId, 'DEMO', null);
    } catch (e) {
      console.error(e);
      setErro('Erro ao criar ambiente de simulação. Verifique a conexão.');
      setVerificando(false);
    }
  };

  const inputClass =
    'w-full px-5 py-3.5 border border-white/60 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm text-slate-800 font-bold focus:border-blue-500 focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400';
  const labelClass = 'block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1.5';

  return (
    <div className="min-h-screen relative flex flex-col font-sans overflow-hidden">
      {/* Background Image Container - Forced to 100% to fit entirely */}
      <div
        className="absolute inset-0 z-0 bg-[length:100%_100%] bg-center bg-no-repeat transition-all duration-1000"
        style={{ backgroundImage: `url('/login-bg.png')` }}
      />

      {/* HEADER SECTION (Top Right) */}
      <header className="absolute top-10 right-10 z-20 flex items-center gap-4">
        <button
          onClick={() => setView('platform')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-[13px] uppercase tracking-wider"
        >
          Acessar Plataforma
        </button>
        <button
          onClick={handleAdminAccess}
          className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-black shadow-sm transition-all active:scale-95 text-[13px] uppercase tracking-wider"
        >
          Acesso Restrito
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 flex-1 w-full">
        {/* FIXED TEST / DEMO BUTTON (Mid Left) - Aligned with the 'A' in 'Aprenda' */}
        <button
          onClick={handleDemoAccess}
          disabled={verificando}
          className="absolute left-[7.5%] top-[60%] group px-8 py-5 bg-white shadow-2xl rounded-2xl flex flex-col items-start gap-1 transition-all hover:shadow-blue-200/50 active:scale-95 border-l-4 border-blue-600"
        >
          <span className="text-blue-600 font-black text-lg flex items-center gap-2">
            {verificando ? 'Iniciando...' : 'Faça um teste grátis'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <span className="text-slate-500 font-bold text-xs uppercase tracking-tight">conhecer a plataforma completa</span>
        </button>
      </main>

      {/* FORM MODAL OVERLAY */}
      {view !== 'menu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-3xl border border-white/60 animate-in zoom-in-95 duration-300">

            <button
              onClick={() => { setView('menu'); setErro(''); }}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">
                {view === 'platform' && 'Opções de Acesso'}
                {view === 'create' && 'Criar sua Conta'}
                {view === 'login' && 'Entrar no Grupo'}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {view === 'platform' && 'Deseja criar ou acessar um grupo?'}
                {view === 'create' && 'Defina seu capital e estratégia'}
                {view === 'login' && 'Informe os dados de simulação'}
              </p>
            </div>

            {view === 'platform' && (
              <div className="space-y-4">
                <button
                  onClick={() => setView('create')}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <UserRoundCheck size={20} />
                  Criar Usuário
                </button>
                <button
                  onClick={() => setView('login')}
                  className="w-full h-16 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Power size={20} />
                  Já sou usuário
                </button>
              </div>
            )}

            {view === 'create' && (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Nome do Grupo</label>
                  <input type="text" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} className={inputClass} placeholder="Nome único" required />
                </div>
                <div>
                  <label className={labelClass}>Capital Inicial (R$)</label>
                  <input type="text" value={displayValue} onChange={handleChange} className={inputClass} placeholder="R$ 0,00" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>% Fixa</label>
                    <input type="number" value={fixo} onChange={(e) => setFixo(e.target.value)} className={inputClass} placeholder="60" min="0" max="100" required />
                  </div>
                  <div>
                    <label className={labelClass}>% Variável</label>
                    <input type="number" value={variavel} onChange={(e) => setVariavel(e.target.value)} className={inputClass} placeholder="40" min="0" max="100" required />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Senha Numérica</label>
                  <input type="password" pattern="\d{6}" inputMode="numeric" value={senha} onChange={(e) => setSenha(e.target.value)} className={`${inputClass} tracking-widest font-mono`} placeholder="6 dígitos" required />
                </div>
                {erro && <p className="text-red-600 text-[11px] font-bold text-center leading-tight">{erro}</p>}
                <button type="submit" disabled={verificando} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl mt-4 disabled:opacity-70">
                  {verificando ? 'Gerando Simulador...' : 'Iniciar Simulação'}
                </button>
              </form>
            )}

            {view === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nome do Grupo</label>
                  <input type="text" value={nomeGrupo} onChange={(e) => setNomeGrupo(e.target.value)} className={inputClass} placeholder="Registrado anteriormente" required />
                </div>
                <div>
                  <label className={labelClass}>Senha (6 dígitos)</label>
                  <input type="password" pattern="\d{6}" inputMode="numeric" value={senha} onChange={(e) => setSenha(e.target.value)} className={`${inputClass} tracking-widest font-mono`} placeholder="••••••" required onKeyDown={(e) => e.key === 'Enter' && verificarGrupo()} />
                </div>
                {erro && <p className="text-red-600 text-[11px] font-bold text-center leading-tight">{erro}</p>}
                <button onClick={verificarGrupo} disabled={verificando} className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black shadow-xl mt-4 disabled:opacity-70">
                  {verificando ? 'Acessando...' : 'Acessar Simulador'}
                </button>
                <Link to="/ranking" className="block w-full">
                  <button className="w-full h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black transition-all flex items-center justify-center gap-2">
                    <Trophy size={18} className="text-yellow-500" />
                    Ver Ranking Global
                  </button>
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

      {mostrarTutorial && <TutorialModal onClose={() => setMostrarTutorial(false)} />}
    </div>
  );
};

export default Login;