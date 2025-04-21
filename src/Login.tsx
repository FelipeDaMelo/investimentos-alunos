import React, { useState, useEffect } from 'react';
import useMoneyInput from './hooks/useMoneyInput';
import { db } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { GrupoInvestimento } from './types/Ativo';

interface LoginProps {
  onLogin: (grupo: GrupoInvestimento) => void;
  onLoading: (isLoading: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onLoading }) => {
  const { 
    value: valorInvestido, 
    displayValue, 
    handleChange,
    setValue
  } = useMoneyInput(0);
  
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [erro, setErro] = useState('');
  const [modoCriacao, setModoCriacao] = useState(false);
  const [grupoExistente, setGrupoExistente] = useState<GrupoInvestimento | null>(null);

  const buscarGrupo = async () => {
    if (!nomeGrupo.trim()) {
      setGrupoExistente(null);
      return;
    }
    
    onLoading(true);
    try {
      const grupoId = nomeGrupo.trim().toLowerCase().replace(/\s+/g, '-');
      const docRef = doc(db, 'gruposInvestimento', grupoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const grupoData = docSnap.data() as GrupoInvestimento;
        setGrupoExistente(grupoData);
        setModoCriacao(false);
        setValue(grupoData.valorTotalInvestido);
      } else {
        setGrupoExistente(null);
        setModoCriacao(true);
      }
    } catch (error) {
      setErro('Erro ao buscar grupo');
      console.error(error);
    } finally {
      onLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      buscarGrupo();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [nomeGrupo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (grupoExistente) {
      onLogin(grupoExistente);
      return;
    }

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

    const novoGrupo: GrupoInvestimento = {
      nome: nomeGrupo.trim(),
      valorTotalInvestido: valorInvestido,
      porcentagemRendaFixa: fixoNum,
      porcentagemRendaVariavel: variavelNum,
      dataCriacao: new Date().toISOString(),
      ativos: [],
      historicoPatrimonio: [],
      configuracoes: {
        moedaPadrao: 'BRL',
        notificacoesAtivadas: true
      }
    };

    onLogin(novoGrupo);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {grupoExistente ? 'Acessar Grupo Existente' : 'Criar Novo Grupo'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Nome do Grupo</label>
          <input
            type="text"
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            placeholder="Digite o nome do grupo"
            required
          />
          {grupoExistente && (
            <p className="mt-1 text-sm text-green-600">
              Grupo encontrado! Você pode acessar ou criar um novo.
            </p>
          )}
        </div>

        {modoCriacao && (
          <>
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
              Obs: A soma das porcentagens deve ser igual a 100%
            </p>
          </>
        )}

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            className={`w-full py-3 px-4 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              grupoExistente
                ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
                : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
            }`}
          >
            {grupoExistente ? 'Acessar Grupo' : 'Criar Novo Grupo'}
          </button>

          {grupoExistente && (
            <button
              type="button"
              onClick={() => {
                setGrupoExistente(null);
                setModoCriacao(true);
                setErro('');
              }}
              className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Criar Novo Grupo
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;