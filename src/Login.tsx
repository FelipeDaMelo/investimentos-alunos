// src/Login.tsx
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [valorInvestido, setValorInvestido] = useState<number>(0);
  const [fixo, setFixo] = useState<number>(0);
  const [variavel, setVariavel] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(valorInvestido, fixo, variavel);
  };

  return (
    <div>
      <h2>Login de Usuário</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="valorInvestido">Valor a ser investido</label>
          <input
            id="valorInvestido"
            type="number"
            value={valorInvestido}
            onChange={(e) => setValorInvestido(Number(e.target.value))}
            placeholder="Digite o valor a ser investido"
            required
          />
        </div>

        <div>
          <label htmlFor="fixo">Porcentagem em Renda Fixa</label>
          <input
            id="fixo"
            type="number"
            value={fixo}
            onChange={(e) => setFixo(Number(e.target.value))}
            placeholder="Digite a porcentagem em renda fixa"
            required
          />
        </div>

        <div>
          <label htmlFor="variavel">Porcentagem em Renda Variável</label>
          <input
            id="variavel"
            type="number"
            value={variavel}
            onChange={(e) => setVariavel(Number(e.target.value))}
            placeholder="Digite a porcentagem em renda variável"
            required
          />
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
