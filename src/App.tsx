// Caminho: src/App.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
// ✅ Modificação: Removido 'useLocation' que não estava em uso.
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import RankingPage from './components/Ranking/RankingPage';
import AdminPage from './components/Admin/AdminPage'; // ✅ Importe a nova página

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);
  const [nomeGrupo, setNomeGrupo] = useState<string>('');
  const [login, setLogin] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Hook do React Router para permitir a navegação entre as rotas
  const navigate = useNavigate();

  // A sua lógica de login anônimo permanece intacta
  useEffect(() => {
    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => setIsAuthReady(true))
      .catch((error) => console.error("Erro no login anônimo:", error));
  }, []);

  // A sua função de login permanece a mesma. O roteador cuidará
  // de mostrar a MainPage automaticamente quando o estado 'login' for preenchido.
  const handleLogin = useCallback(
    (
      valorInvestido: number,
      fixo: number,
      variavel: number,
      nomeGrupo: string
    ) => {
      setValorInvestido(valorInvestido);
      setFixo(fixo);
      setVariavel(variavel);
      setNomeGrupo(nomeGrupo);
      setLogin(nomeGrupo);
    },
    []
  );

  // A função de logout agora usa o 'navigate' para garantir
  // que o usuário seja sempre redirecionado para a página de login.
  const handleLogout = useCallback(() => {
    setLogin(null);
    setValorInvestido(0);
    setFixo(0);
    setVariavel(0);
    setNomeGrupo('');
    navigate('/'); 
    window.scrollTo(0, 0); 
  }, [navigate]);

  if (!isAuthReady) {
    return <div>Inicializando sessão...</div>;
  }

  // Esta é a nova estrutura principal do seu App.
  // O componente <Routes> age como um "switch" que renderiza o componente
  // correspondente à URL atual do navegador.
  return (
    <div className="min-h-screen relative pb-20">
      <Routes>
        {/* Rota Raiz ("/"): Mostra Login OU MainPage dependendo do estado 'login' */}
        <Route 
          path="/" 
          element={
            !login ? (
              <Login onLogin={handleLogin} />
            ) : (
              <MainPage 
                login={login} 
                valorInvestido={valorInvestido} 
                fixo={fixo} 
                variavel={variavel} 
                nomeGrupo={nomeGrupo} 
                onLogout={handleLogout}
              />
            )
          } 
        />

        {/* Rota do Ranking ("/ranking"): Mostra sempre a RankingPage */}
        <Route 
          path="/ranking" 
          element={
            <RankingPage 
              // O botão "voltar" dentro de RankingPage agora usa o histórico do navegador
              onBack={() => navigate(-1)} 
            />
          } 
        />
              <Route path="/admin" element={<AdminPage />} />
      </Routes>

      <footer className="app-footer">
        Desenvolvido por Prof. Dr. Felipe Damas Melo
      </footer>
    </div>
  );
};

export default App;