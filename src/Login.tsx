// src/Login.tsx
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [valorInvestido, setValorInvestido] = useState<number | string>('');
  const [fixo, setFixo] = useState<number | string>('');
  const [variavel, setVariavel] = useState<number | string>('');
  const [nomeGrupo, setNomeGrupo] = useState<string>('');
  const [erro, setErro] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fixoNum = Number(fixo);
    const variavelNum = Number(variavel);

    if (fixoNum + variavelNum !== 100) {
      setErro('A soma das porcentagens de renda fixa e variável deve ser 100%.');
      return;
    }

    setErro('');
    onLogin(Number(valorInvestido), fixoNum, variavelNum, nomeGrupo);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '1rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Login de Usuário</h2>
      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="nomeGrupo" style={{ display: 'block', marginBottom: '8px' }}>Nome do Grupo</label>
          <input
            id="nomeGrupo"
            type="text"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            placeholder="Digite o nome do grupo"
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="valorInvestido" style={{ display: 'block', marginBottom: '8px' }}>Valor a ser investido</label>
          <input
            id="valorInvestido"
            type="number"
            value={valorInvestido}
            onChange={(e) => setValorInvestido(e.target.value)}
            placeholder="Digite o valor a ser investido"
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="fixo" style={{ display: 'block', marginBottom: '8px' }}>Porcentagem em Renda Fixa</label>
          <input
            id="fixo"
            type="number"
            value={fixo}
            onChange={(e) => setFixo(e.target.value)}
            placeholder="Ex: 60"
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="variavel" style={{ display: 'block', marginBottom: '8px' }}>Porcentagem em Renda Variável</label>
          <input
            id="variavel"
            type="number"
            value={variavel}
            onChange={(e) => setVariavel(e.target.value)}
            placeholder="Ex: 40"
            required
            style={{ padding: '8px', width: '100%' }}
          />
        </div>

        <p style={{ fontSize: '0.9em', color: 'gray', marginBottom: '1rem' }}>
          OBS: Não é necessário digitar o símbolo "%" ao preencher as porcentagens.
        </p>

        {erro && <p style={{ color: 'red', marginBottom: '1rem' }}>{erro}</p>}

        <button type="submit" style={{
          padding: '10px 20px',
          backgroundColor: '#007BFF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;
