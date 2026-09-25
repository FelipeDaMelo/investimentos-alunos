import React, { useState, useEffect } from 'react';
import useMoneyInput from './hooks/useMoneyInput';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Power, UserRoundCheck, Trophy, ArrowRight, ArrowLeft, ShieldAlert, Sparkles, Briefcase, Building2, QrCode } from 'lucide-react';
import TutorialModal from './TutorialModal';
import { Link, useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string, senha: string, fotoGrupo: string | null) => void;
}

type ViewState = 'menu' | 'platform' | 'create' | 'login';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { value: valorInvestido, displayValue, handleChange } = useMoneyInput(0);
  const navigate = useNavigate();
  const isMG3 = window.location.pathname.includes('mg3');

  const [view, setView] = useState<ViewState>('menu');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [senha, setSenha] = useState('');
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  const [temIntencaoInvestir, setTemIntencaoInvestir] = useState(false);

  useEffect(() => {
    if (!isMG3) return;
    const search = window.location.search;
    if (search && (search.includes('investir') || search.includes('wizard') || search.includes('action'))) {
      sessionStorage.setItem('mg3_redirect_intent', search);
      setTemIntencaoInvestir(true);
    } else {
      const intentSalva = sessionStorage.getItem('mg3_redirect_intent');
      if (intentSalva) {
        setTemIntencaoInvestir(true);
      }
    }
  }, [isMG3]);

  // Configurações globais do MG3 definidas pelo Admin
  const [mg3Config, setMg3Config] = useState({
    capitalInicial: 100000,
    percentualFixa: 40,
    loading: isMG3
  });

  useEffect(() => {
    if (!isMG3) return;

    const carregarConfigMG3 = async () => {
      try {
        const snap = await getDoc(doc(db, 'admin', 'mg3_config'));
        if (snap.exists()) {
          const data = snap.data();
          setMg3Config({
            capitalInicial: data.capitalInicial ?? 100000,
            percentualFixa: data.percentualFixa ?? 40,
            loading: false
          });
        } else {
          setMg3Config(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Erro ao buscar mg3_config:', err);
        setMg3Config(prev => ({ ...prev, loading: false }));
      }
    };

    carregarConfigMG3();
  }, [isMG3]);

  const nomeGrupoNormalizado = nomeGrupo.trim().toUpperCase();

  const verificarGrupo = async () => {
    if (!nomeGrupoNormalizado) {
      setErro('Informe o nome do grupo');
      return;
    }
    if (!senha) {
      setErro('Digite a senha de 6 dígitos');
      return;
    }

    setVerificando(true);
    setErro('');
    try {
      if (isMG3) {
        // Busca na base exclusiva do ecossistema MG3
        const docRef = doc(db, 'usuarios_mg3', nomeGrupoNormalizado);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.senha && data.senha !== senha) {
            setErro('Senha incorreta para este grupo do MG3.');
            setVerificando(false);
            return;
          }

          onLogin(
            data.valorInvestido || mg3Config.capitalInicial,
            data.porcentagemFixa ?? mg3Config.percentualFixa,
            data.porcentagemVariavel ?? (100 - mg3Config.percentualFixa),
            nomeGrupoNormalizado,
            senha,
            data.fotoGrupo || null
          );
        } else {
          setErro('Grupo não encontrado na Bolsa MG3. Verifique o nome ou crie sua conta.');
        }
      } else {
        // Busca na base padrão de alunos
        const docRef = doc(db, 'usuarios', nomeGrupoNormalizado);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.senha && data.senha !== senha) {
            setErro('Senha incorreta para este grupo.');
            setVerificando(false);
            return;
          }

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

    if (!nomeGrupoNormalizado) {
      setErro('Informe o nome do grupo.');
      return;
    }

    if (senha.length !== 6) {
      setErro('A senha deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    setVerificando(true);
    setErro('');

    try {
      const dataAtual = new Date().toISOString();
      const hoje = dataAtual.split('T')[0];

      if (isMG3) {
        // FLUXO DO AMBIENTE MG3: Regras definidas pelo Admin
        const docRef = doc(db, 'usuarios_mg3', nomeGrupoNormalizado);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setErro('Este nome de grupo já está cadastrado na Bolsa MG3.');
          setVerificando(false);
          return;
        }

        const capital = mg3Config.capitalInicial;
        const percFixa = mg3Config.percentualFixa;
        const percVariavel = 100 - percFixa;
        const valorFixa = capital * (percFixa / 100);
        const valorVariavel = capital - valorFixa;

        const historicoInicial = [
          { tipo: 'deposito', valor: valorFixa, destino: 'fixa', data: dataAtual, descricao: 'Aporte Inicial MG3' },
          { tipo: 'deposito', valor: valorVariavel, destino: 'variavel', data: dataAtual, descricao: 'Aporte Inicial MG3' }
        ];

        await setDoc(docRef, {
          nomeGrupo: nomeGrupoNormalizado,
          valorInvestido: capital,
          porcentagemFixa: percFixa,
          porcentagemVariavel: percVariavel,
          ativos: [],
          senha,
          historico: historicoInicial,
          totalCotas: capital,
          valorCotaPorDia: { [hoje]: 1 },
          patrimonioPorDia: { [hoje]: capital },
          rentabilidade: 0,
          patrimonioTotal: capital,
          criadoEm: dataAtual
        });

        onLogin(capital, percFixa, percVariavel, nomeGrupoNormalizado, senha, null);
      } else {
        // FLUXO DO AMBIENTE REAL / PADRÃO
        const fixoNum = parseFloat(fixo);
        const variavelNum = parseFloat(variavel);

        if (isNaN(fixoNum) || isNaN(variavelNum)) {
          setErro('Insira valores numéricos válidos para os percentuais.');
          setVerificando(false);
          return;
        }
        if (fixoNum + variavelNum !== 100) {
          setErro('A soma das porcentagens (Fixa + Variável) deve ser exatamente 100%.');
          setVerificando(false);
          return;
        }
        if (valorInvestido <= 0) {
          setErro('O capital inicial deve ser positivo.');
          setVerificando(false);
          return;
        }

        const docRef = doc(db, 'usuarios', nomeGrupoNormalizado);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setErro('Este nome de grupo já está em uso.');
          setVerificando(false);
          return;
        }

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
      }
    } catch (err) {
      console.error(err);
      setErro('Ocorreu um erro ao criar o usuário. Tente novamente.');
    } finally {
      setVerificando(false);
    }
  };

  const handleAdminAccess = () => {
    onLogin(0, 0, 0, 'ADMINISTRATOR_SYSTEM_OVERRIDE', '', null);
    navigate(isMG3 ? '/admin-mg3' : '/admin');
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
      {/* Background Image Container - DYNAMIC SWAP */}
      <div
        className="absolute inset-0 z-0 bg-[length:100%_100%] bg-center bg-no-repeat transition-all duration-1000 block md:hidden"
        style={{ backgroundImage: `url('/${isMG3 ? 'login-bg-mobile-mg3.png' : 'login-bg-mobile.png'}')` }}
      />
      <div
        className="absolute inset-0 z-0 bg-[length:100%_100%] bg-center bg-no-repeat transition-all duration-1000 hidden md:block"
        style={{ backgroundImage: `url('/${isMG3 ? 'login-bg-mg3.png' : 'login-bg.png'}')` }}
      />

      {/* ----------------- DESKTOP LAYOUT (HIDDEN ON MOBILE) ----------------- */}
      <div className="hidden md:contents">
        {/* HEADER SECTION (Top Right) */}
        <header className="absolute top-10 right-10 z-20 flex items-center gap-3">
          <button
            onClick={() => setView('platform')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-[13px] uppercase tracking-wider"
          >
            {isMG3 ? 'Acessar Bolsa MG3' : 'Acessar Plataforma'}
          </button>
          <button
            onClick={handleAdminAccess}
            className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-black shadow-sm transition-all active:scale-95 text-[13px] uppercase tracking-wider flex items-center gap-1.5"
          >
            <ShieldAlert size={14} className="text-slate-400" />
            Acesso Restrito
          </button>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="relative z-10 flex-1 w-full flex items-center">
          {!isMG3 && (
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
          )}
        </main>
      </div>

      {/* ----------------- MOBILE LAYOUT (HIDDEN ON DESKTOP) ----------------- */}
      <div className="md:hidden relative z-10 flex-1 flex flex-col justify-end p-8 pb-20">
        <div className="space-y-3">
          {!isMG3 && (
            <button
              onClick={handleDemoAccess}
              disabled={verificando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-2xl font-black shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all mb-1"
            >
              <Sparkles size={20} />
              {verificando ? 'Iniciando Simulação...' : 'Testar Agora (Grátis)'}
            </button>
          )}

          <button
            onClick={() => setView('platform')}
            className="w-full bg-white/90 backdrop-blur-md p-5 rounded-2xl font-black text-slate-800 shadow-lg flex items-center justify-center gap-3 active:scale-95"
          >
            <Briefcase size={20} className="text-blue-600" />
            {isMG3 ? 'Acessar Bolsa MG3' : 'Acessar Plataforma'}
          </button>

          <button
            onClick={handleAdminAccess}
            className="w-full bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-3 active:scale-95 border border-white/10"
          >
            <ShieldAlert size={20} className="text-slate-400" />
            Acesso Restrito
          </button>
        </div>
      </div>

      {/* FORM MODAL OVERLAY */}
      {view !== 'menu' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-3xl border border-white/60 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">

            <button
              onClick={() => { setView('menu'); setErro(''); }}
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="text-center mb-6">
              {temIntencaoInvestir && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-[11px] font-black rounded-full mb-3 shadow-xs">
                  <QrCode size={13} /> QR Code do Evento detectado
                </div>
              )}
              <h2 className="text-2xl font-black text-slate-800">
                {view === 'platform' && (isMG3 ? 'Bolsa MG3 - Acesso' : 'Opções de Acesso')}
                {view === 'create' && (isMG3 ? 'Cadastro de Equipe MG3' : 'Criar sua Conta')}
                {view === 'login' && (isMG3 ? 'Entrar na Equipe MG3' : 'Entrar no Grupo')}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {view === 'platform' && (isMG3 ? (temIntencaoInvestir ? 'Identifique sua equipe para abrir os investimentos' : 'Cadastre ou acesse a carteira do seu grupo') : 'Deseja criar ou acessar um grupo?')}
                {view === 'create' && (isMG3 ? 'Regras e capital definidos pela organização' : 'Defina seu capital e estratégia')}
                {view === 'login' && (isMG3 ? 'Informe o nome e senha do grupo cadastrado' : 'Informe os dados de simulação')}
              </p>
            </div>

            {view === 'platform' && (
              <div className="space-y-4">
                <button
                  onClick={() => setView('create')}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <UserRoundCheck size={20} />
                  {isMG3 ? 'Cadastrar Nova Equipe' : 'Criar Usuário'}
                </button>
                <button
                  onClick={() => setView('login')}
                  className="w-full h-16 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black shadow-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Power size={20} />
                  {isMG3 ? 'Já possuo Equipe' : 'Já sou usuário'}
                </button>
              </div>
            )}

            {view === 'create' && (
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className={labelClass}>Nome do Grupo / Equipe</label>
                  <input
                    type="text"
                    value={nomeGrupo}
                    onChange={(e) => setNomeGrupo(e.target.value)}
                    className={inputClass}
                    placeholder={isMG3 ? "Ex: NOME_DO_GRUPO" : "Nome único"}
                    required
                  />
                </div>

                {isMG3 ? (
                  /* CARD DE REGRAS PRÉ-FIXADAS DO MG3 (DEFINIDAS PELO ADMIN) */
                  <div className="bg-gradient-to-br from-blue-50/90 to-slate-50 border border-blue-100 rounded-2xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                        <Building2 size={14} /> Regras de Capital MG3
                      </span>
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                        Fixado pelo Admin
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-blue-100/70">
                      <span className="text-xs font-bold text-slate-500">Capital Inicial:</span>
                      <span className="text-base font-black text-slate-800">
                        {mg3Config.capitalInicial.toLocaleString('pt-BR')}{' '}
                        <span className="text-xs font-bold text-blue-600">GloriaCoins</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Renda Fixa</p>
                        <p className="text-sm font-black text-slate-700">{mg3Config.percentualFixa}%</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {((mg3Config.capitalInicial * mg3Config.percentualFixa) / 100).toLocaleString('pt-BR')} GC
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Renda Variável</p>
                        <p className="text-sm font-black text-blue-600">{100 - mg3Config.percentualFixa}%</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {((mg3Config.capitalInicial * (100 - mg3Config.percentualFixa)) / 100).toLocaleString('pt-BR')} GC
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 text-center font-medium leading-tight pt-1">
                      O capital é padronizado para garantir disputa justa e equilibrada entre todas as equipes da Mostra.
                    </p>
                  </div>
                ) : (
                  /* CAMPOS PERSONALIZADOS DA PLATAFORMA REAL */
                  <>
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
                  </>
                )}

                <div>
                  <label className={labelClass}>Senha Numérica do Grupo (6 dígitos)</label>
                  <input
                    type="password"
                    pattern="\d{6}"
                    inputMode="numeric"
                    maxLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} tracking-widest font-mono text-center text-lg`}
                    placeholder="••••••"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Utilize 6 números para autorizar compras, vendas e resgates.</p>
                </div>

                {erro && <p className="text-red-600 text-[11px] font-bold text-center leading-tight bg-red-50 p-2.5 rounded-xl border border-red-100">{erro}</p>}

                <button
                  type="submit"
                  disabled={verificando}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl mt-4 disabled:opacity-70 transition-all active:scale-[0.98]"
                >
                  {verificando
                    ? 'Preparando Carteira...'
                    : (isMG3 ? 'Cadastrar Equipe e Iniciar MG3' : 'Iniciar Simulação')}
                </button>
              </form>
            )}

            {view === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Nome do Grupo</label>
                  <input
                    type="text"
                    value={nomeGrupo}
                    onChange={(e) => setNomeGrupo(e.target.value)}
                    className={inputClass}
                    placeholder={isMG3 ? "Nome do grupo cadastrado no MG3" : "Registrado anteriormente"}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Senha (6 dígitos)</label>
                  <input
                    type="password"
                    pattern="\d{6}"
                    inputMode="numeric"
                    maxLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} tracking-widest font-mono text-center text-lg`}
                    placeholder="••••••"
                    required
                    onKeyDown={(e) => e.key === 'Enter' && verificarGrupo()}
                  />
                </div>

                {erro && <p className="text-red-600 text-[11px] font-bold text-center leading-tight bg-red-50 p-2.5 rounded-xl border border-red-100">{erro}</p>}

                <button
                  onClick={verificarGrupo}
                  disabled={verificando}
                  className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black shadow-xl mt-4 disabled:opacity-70 transition-all active:scale-[0.98]"
                >
                  {verificando
                    ? 'Acessando...'
                    : (isMG3 ? 'Acessar Bolsa MG3' : 'Acessar Plataforma')}
                </button>

                {!isMG3 && (
                  <Link to="/ranking" className="block w-full">
                    <button className="w-full h-14 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black transition-all flex items-center justify-center gap-2 hover:bg-slate-50">
                      <Trophy size={18} className="text-yellow-500" />
                      Ver Ranking Global
                    </button>
                  </Link>
                )}
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