// src/App.tsx
import React, { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);
  const [login, setLogin] = useState<string | null>(null); // nome do grupo

  const handleLogin = (
    valorInvestido: number,
    fixo: number,
    variavel: number,
    nomeGrupo: string
  ) => {
    setValorInvestido(valorInvestido);
    setFixo(Number(fixo));
    setVariavel(Number(variavel));
    setLogin(nomeGrupo); // agora de fato armazena o nome do grupo
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
        />
      )}
    </div>
  );
};

export default App;
