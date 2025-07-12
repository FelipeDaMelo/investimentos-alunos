// src/App.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'; // Importações necessárias
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);
  const [nomeGrupo, setNomeGrupo] = useState<string>('');
  const [login, setLogin] = useState<string | null>(null);
  
  // NOVO: Estado para saber se o login anônimo foi concluído
  const [isAuthReady, setIsAuthReady] = useState(false);

  // NOVO: Hook para fazer o login anônimo UMA VEZ quando o app carregar
  useEffect(() => {
    const auth = getAuth();
    signInAnonymously(auth)
      .then(() => {
        // Sucesso! Agora temos um usuário temporário autenticado.
        console.log("Login anônimo realizado com sucesso.");
        setIsAuthReady(true); // Libera a exibição do app
      })
      .catch((error) => {
        console.error("Erro no login anônimo:", error);
      });
  }, []); // O array vazio [] garante que rode só uma vez.

  const handleLogin = useCallback(
    (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => {
      setValorInvestido(valorInvestido);
      setFixo(fixo);
      setVariavel(variavel);
      setNomeGrupo(nomeGrupo);
      setLogin(nomeGrupo);
    },
    []
  );

  // Não mostra nada até que a sessão anônima esteja pronta
  if (!isAuthReady) {
    return <div>Inicializando sessão...</div>;
  }

  return (
    <div className="min-h-screen relative pb-20">
      {!login ? (
        <Login onLogin={handleLogin} />
      ) : (
        <MainPage 
          login={login} 
          valorInvestido={valorInvestido} 
          fixo={fixo} 
          variavel={variavel} 
          nomeGrupo={nomeGrupo} 
        />
      )}

      <footer>
        Desenvolvido por Prof. Dr. Felipe Damas Melo
      </footer>
    </div>
  );
};

export default App;