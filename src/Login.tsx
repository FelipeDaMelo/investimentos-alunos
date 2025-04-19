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
      setErro('A soma das porcentagens deve ser 100%');
      return;
    }

    if (!nomeGrupo.trim()) {
      setErro('Nome do grupo é obrigatório');
      return;
    }

    if (!valorInvestido || Number(valorInvestido) <= 0) {
      setErro('Valor investido deve ser positivo');
      return;
    }

    setErro('');
    onLogin(Number(valorInvestido), fixoNum, variavelNum, nomeGrupo);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Configuração Inicial</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nomeGrupo" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Grupo
          </label>
          <input
            id="nomeGrupo"
            type="text"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            placeholder="Ex: Grupo de Investimentos"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="valorInvestido" className="block text-sm font-medium text-gray-700 mb-1">
            Valor Total para Investir (R$)
          </label>
          <input
            id="valorInvestido"
            type="number"
            value={valorInvestido}
            onChange={(e) => setValorInvestido(e.target.value)}
            placeholder="Ex: 10000"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fixo" className="block text-sm font-medium text-gray-700 mb-1">
              % Renda Fixa
            </label>
            <input
              id="fixo"
              type="number"
              value={fixo}
              onChange={(e) => setFixo(e.target.value)}
              placeholder="Ex: 60"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="variavel" className="block text-sm font-medium text-gray-700 mb-1">
              % Renda Variável
            </label>
            <input
              id="variavel"
              type="number"
              value={variavel}
              onChange={(e) => setVariavel(e.target.value)}
              placeholder="Ex: 40"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Obs: Não inclua o símbolo "%" - apenas números (a soma deve ser 100)
        </p>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Iniciar Simulação
        </button>
      </form>
    </div>
  );
};

export default Login;