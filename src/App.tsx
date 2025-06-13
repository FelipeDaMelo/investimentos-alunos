// src/App.tsx
import React, { useState, useCallback } from 'react';
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);
  const [nomeGrupo, setNomeGrupo] = useState<string>('');
  const [login, setLogin] = useState<string | null>(null);

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
