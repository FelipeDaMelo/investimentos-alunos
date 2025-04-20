import React, { useState } from 'react';
import useMoneyInput from '../hooks/useMoneyInput';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { 
    value: valorInvestido, 
    displayValue, 
    handleChange 
  } = useMoneyInput(0);
  
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fixoNum = parseFloat(fixo);
    const variavelNum = parseFloat(variavel);

    if (isNaN(fixoNum) || isNaN(variavelNum)) {
      setErro('Por favor, insira valores numéricos válidos');
      return;
    }

    if (fixoNum + variavelNum !== 100) {
      setErro('A soma das porcentagens deve ser 100%');
      return;
    }

    if (!nomeGrupo.trim()) {
      setErro('Nome do grupo é obrigatório');
      return;
    }

    if (valorInvestido <= 0) {
      setErro('Valor investido deve ser positivo');
      return;
    }

    onLogin(valorInvestido, fixoNum, variavelNum, nomeGrupo);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Configuração Inicial</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Nome do Grupo</label>
          <input
            type="text"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            placeholder="Ex: Grupo de Investimentos"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Valor Total para Investir</label>
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            placeholder="R$ 0,00"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-medium text-gray-700">% Renda Fixa</label>
            <input
              type="number"
              value={fixo}
              onChange={(e) => setFixo(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              placeholder="Ex: 60"
              min="0"
              max="100"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">% Renda Variável</label>
            <input
              type="number"
              value={variavel}
              onChange={(e) => setVariavel(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              placeholder="Ex: 40"
              min="0"
              max="100"
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
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Iniciar Simulação
        </button>
      </form>
    </div>
  );
};

export default Login;