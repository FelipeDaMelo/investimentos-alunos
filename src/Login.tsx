// src/Login.tsx
import React, { useState } from 'react';

const TelaDeLogin = ({ onLogin }: { onLogin: (valorInvestido: number, fixo: number, variavel: number) => void }) => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [porcentagemFixa, setPorcentagemFixa] = useState<number>(0);
  const [porcentagemVariavel, setPorcentagemVariavel] = useState<number>(0);
  const [erro, setErro] = useState<string>('');

  const handleSubmit = () => {
    // Verifica se as porcentagens somam 100%
    if (porcentagemFixa + porcentagemVariavel !== 100) {
      setErro('A soma das porcentagens deve ser 100%');
      return;
    }
    
    // Passa os valores para a próxima tela
    onLogin(valorInvestido, porcentagemFixa, porcentagemVariavel);
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="number"
        placeholder="Valor Investido"
        value={valorInvestido}
        onChange={(e) => setValorInvestido(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="Porcentagem em Renda Fixa"
        value={porcentagemFixa}
        onChange={(e) => setPorcentagemFixa(Number(e.target.value))}
      />
      <input
        type="number"
        placeholder="Porcentagem em Renda Variável"
        value={porcentagemVariavel}
        onChange={(e) => setPorcentagemVariavel(Number(e.target.value))}
      />
      <button onClick={handleSubmit}>Login</button>
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
    </div>
  );
};

export default TelaDeLogin;
