// src/App.tsx
import React, { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);
  const [nomeGrupo, setNomeGrupo] = useState<string>('');

  const [login, setLogin] = useState<string | null>(null);

  const handleLogin = (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => {
    setValorInvestido(valorInvestido);
    setFixo(fixo);
    setVariavel(variavel);
    setNomeGrupo(nomeGrupo);
    setLogin(nomeGrupo); // Usa o nome do grupo como login do usuário
  };

  return (
    <div>
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
    </div>
  );
};

export default App;
