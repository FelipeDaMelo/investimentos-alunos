// src/App.tsx
import React, { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  // Estado para armazenar os valores numéricos
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);

  // Função para lidar com o login e os valores financeiros
  const handleLogin = (valorInvestido: number, fixo: number, variavel: number) => {
    setValorInvestido(valorInvestido);
    setFixo(fixo);
    setVariavel(variavel);
  };

  return (
    <div>
      {/* Se não tiver login ou valorInvestido, exibe o formulário de login */}
      {!valorInvestido ? (
        <Login onLogin={handleLogin} />
      ) : (
        <MainPage valorInvestido={valorInvestido} fixo={fixo} variavel={variavel} />
      )}
    </div>
  );
};

export default App;
