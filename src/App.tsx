// Caminho: src/App.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, signInAnonymously } from 'firebase/auth';
// ✅ Modificação: Removido 'useLocation' que não estava em uso.
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './Login';
import MainPage from './MainPage';
import RankingPage from './components/Ranking/RankingPage';
import AdminPage from './components/Admin/AdminPage'; // ✅ Importe a nova página
import NovidadesMercado from './components/Novidades/NovidadesMercado';
import { db, storage } from './firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(() => Number(sessionStorage.getItem('valorInvestido')) || 0);
  const [fixo, setFixo] = useState<number>(() => Number(sessionStorage.getItem('fixo')) || 0);
  const [variavel, setVariavel] = useState<number>(() => Number(sessionStorage.getItem('variavel')) || 0);
  const [nomeGrupo, setNomeGrupo] = useState<string>(() => sessionStorage.getItem('nomeGrupo') || '');
  const [fotoGrupo, setFotoGrupo] = useState<string | null>(() => sessionStorage.getItem('fotoGrupo'));
  const [senhaSalva, setSenhaSalva] = useState<string>(() => sessionStorage.getItem('senhaSalva') || '');
  const [login, setLogin] = useState<string | null>(() => sessionStorage.getItem('login'));
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
      nomeGrupo: string,
      senha: string,
      fotoGrupo: string | null
    ) => {
      setValorInvestido(valorInvestido);
      setFixo(fixo);
      setVariavel(variavel);
      setNomeGrupo(nomeGrupo);
      setLogin(nomeGrupo);
      setSenhaSalva(senha);
      setFotoGrupo(fotoGrupo);

      // Persistir no sessionStorage
      sessionStorage.setItem('valorInvestido', valorInvestido.toString());
      sessionStorage.setItem('fixo', fixo.toString());
      sessionStorage.setItem('variavel', variavel.toString());
      sessionStorage.setItem('nomeGrupo', nomeGrupo);
      sessionStorage.setItem('login', nomeGrupo);
      sessionStorage.setItem('senhaSalva', senha);
      if (fotoGrupo) sessionStorage.setItem('fotoGrupo', fotoGrupo);
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
    setSenhaSalva('');
    setFotoGrupo(null);
    
    sessionStorage.clear();
    
    navigate('/'); 
    window.scrollTo(0, 0); 
  }, [navigate]);

  const handleImpersonate = useCallback((userId: string, fotoGrupo: string | null) => {
    setLogin(userId);
    setFotoGrupo(fotoGrupo || null);
    
    sessionStorage.setItem('login', userId);
    if (fotoGrupo) sessionStorage.setItem('fotoGrupo', fotoGrupo);
    else sessionStorage.removeItem('fotoGrupo');
    
    navigate('/');
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleUploadConfirmado = useCallback(async (file: File, senhaDigitada: string) => {
    if (!login) return;
    if (senhaDigitada !== senhaSalva) {
      alert('Senha incorreta!');
      throw new Error("Senha incorreta");
    }
    try {
      const storageRef = ref(storage, `fotosGrupos/${login}-${new Date().getTime()}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'usuarios', login), { fotoGrupo: url });
      setFotoGrupo(url);
      sessionStorage.setItem('fotoGrupo', url);
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao enviar imagem.");
      throw error;
    }
  }, [login, senhaSalva]);

  if (!isAuthReady) {
    return <div>Inicializando sessão...</div>;
  }

  // Esta é a nova estrutura principal do seu App.
  // O componente <Routes> age como um "switch" que renderiza o componente
  // correspondente à URL atual do navegador.
  return (
    <div className="relative">
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
                fotoGrupo={fotoGrupo}
                setFotoGrupo={setFotoGrupo}
                onLogout={handleLogout}
                onUploadConfirmado={handleUploadConfirmado}
              />
            )
          } 
        />

        <Route 
          path="/ranking" 
          element={
            <RankingPage 
              onBack={() => navigate(-1)} 
              login={login || ''}
              fotoGrupo={fotoGrupo}
              onLogout={handleLogout}
              onUploadConfirmado={handleUploadConfirmado}
            />
          } 
        />
              <Route 
                path="/admin" 
                element={
                  !login ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <AdminPage 
                      login={login}
                      fotoGrupo={fotoGrupo}
                      onLogout={handleLogout}
                      onUploadConfirmado={handleUploadConfirmado}
                      onImpersonate={handleImpersonate}
                    />
                  )
                } 
              />
              <Route 
                path="/novidades" 
                element={
                  !login ? (
                    <Login onLogin={handleLogin} />
                  ) : (
                    <NovidadesMercado 
                      login={login}
                      fotoGrupo={fotoGrupo}
                      onLogout={handleLogout}
                      onUploadConfirmado={handleUploadConfirmado}
                    />
                  )
                } 
              />
      </Routes>

    </div>
  );
};

export default App;