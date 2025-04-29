import React, { useState } from 'react';
import useMoneyInput from './hooks/useMoneyInput';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Button from './components/Button';


interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { value: valorInvestido, displayValue, handleChange } = useMoneyInput(0);

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [grupoExistente, setGrupoExistente] = useState<boolean | null>(null);

  const verificarGrupo = async () => {
    if (!nomeGrupo.trim()) {
      setErro('Informe o nome do grupo');
      return;
    }

    setVerificando(true);
    try {
      const docRef = doc(db, 'usuarios', nomeGrupo);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        onLogin(
          data.valorInvestido,
          data.porcentagemFixa,
          data.porcentagemVariavel,
          nomeGrupo
        );
      } else {
        setGrupoExistente(false); // grupo é novo, segue para preencher formulário
      }
    } catch (err) {
      setErro('Erro ao verificar grupo');
      console.error(err);
    } finally {
      setVerificando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (valorInvestido <= 0) {
      setErro('Valor investido deve ser positivo');
      return;
    }

    // Salva dados iniciais no Firestore
    await setDoc(doc(db, 'usuarios', nomeGrupo), {
      valorInvestido,
      porcentagemFixa: fixoNum,
      porcentagemVariavel: variavelNum,
      ativos: []
    });

    onLogin(valorInvestido, fixoNum, variavelNum, nomeGrupo);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Bem-vindo ao Simulador</h2>

      <div className="space-y-4">
        <label className="block mb-2 font-medium text-gray-700">Nome do Grupo</label>
        <input
          type="text"
          value={nomeGrupo}
          onChange={(e) => setNomeGrupo(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          placeholder="Ex: Grupo de Investimentos"
          required
        />

        {grupoExistente === null && (
          <Button
  onClick={verificarGrupo}
  disabled={verificando}
  className="w-full"
>
  {verificando ? 'Verificando...' : 'Verificar Grupo'}
</Button>
        )}

        {grupoExistente === false && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
              Obs: A soma deve ser 100%
            </p>

            {erro && <p className="text-red-500 text-sm">{erro}</p>}

            <Button
  type="submit"
  className="w-full"
>
  Iniciar Simulação
</Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
