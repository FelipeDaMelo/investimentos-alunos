// src/Login.tsx
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [valorInvestido, setValorInvestido] = useState<number | string>(''); // Mudança aqui para aceitar string
  const [fixo, setFixo] = useState<number | string>(''); // Mudança aqui para aceitar string
  const [variavel, setVariavel] = useState<number | string>(''); // Mudança aqui para aceitar string
  const [nomeGrupo, setNomeGrupo] = useState<string>(''); // Campo para o nome do grupo

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(Number(valorInvestido), Number(fixo), Number(variavel), nomeGrupo); // Convertendo para número ao enviar
  };

  return (
    <div>
      <h2>Login de Usuário</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nomeGrupo" style={{ marginBottom: '8px', display: 'block' }}>Nome do Grupo</label>
          <input
            id="nomeGrupo"
            type="text"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            placeholder="Digite o nome do grupo"
            required
            style={{ marginBottom: '16px', padding: '8px' }}
          />
        </div>

        <div>
          <label htmlFor="valorInvestido" style={{ marginBottom: '8px', display: 'block' }}>Valor a ser investido</label>
          <input
            id="valorInvestido"
            type="number"
            value={valorInvestido}
            onChange={(e) => setValorInvestido(e.target.value)}
            placeholder="Digite o valor a ser investido"
            required
            style={{ marginBottom: '16px', padding: '8px' }}
          />
        </div>

        <div>
          <label htmlFor="fixo" style={{ marginBottom: '8px', display: 'block' }}>Porcentagem em Renda Fixa</label>
          <input
            id="fixo"
            type="number"
            value={fixo}
            onChange={(e) => setFixo(e.target.value)}
            placeholder="Digite a porcentagem em renda fixa"
            required
            style={{ marginBottom: '16px', padding: '8px' }}
          />
        </div>

        <div>
          <label htmlFor="variavel" style={{ marginBottom: '8px', display: 'block' }}>Porcentagem em Renda Variável</label>
          <input
            id="variavel"
            type="number"
            value={variavel}
            onChange={(e) => setVariavel(e.target.value)}
            placeholder="Digite a porcentagem em renda variável"
            required
            style={{ marginBottom: '16px', padding: '8px' }}
          />
        </div>

        {/* Instrução para o usuário */}
        <div style={{ marginTop: '10px', fontSize: '0.9em', color: 'gray' }}>
          <p>OBS: Não é necessário digitar o símbolo "%" ao preencher as porcentagens.</p>
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default Login;
