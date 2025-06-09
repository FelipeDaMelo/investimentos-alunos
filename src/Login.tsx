import React, { useState } from 'react';
import useMoneyInput from './hooks/useMoneyInput';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebaseConfig';
import Button from './components/Button';
import { Power, UserRoundCheck } from 'lucide-react';
import TutorialModal from './TutorialModal'; // certifique-se que o caminho esteja correto

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string, senha: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { value: valorInvestido, displayValue, handleChange } = useMoneyInput(0);

  const [nomeGrupo, setNomeGrupo] = useState('');
  const [fixo, setFixo] = useState('');
  const [variavel, setVariavel] = useState('');
  const [erro, setErro] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [grupoExistente, setGrupoExistente] = useState<boolean | null>(null);
  const [senha, setSenha] = useState('');
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

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
          nomeGrupo,
          senha,
        );
      } else {
        setGrupoExistente(false);
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

    const dataAtual = new Date().toISOString();

    await setDoc(doc(db, 'usuarios', nomeGrupo), {
      valorInvestido,
      porcentagemFixa: fixoNum,
      porcentagemVariavel: variavelNum,
      ativos: [],
      senha,
      historico: arrayUnion(
        {
          tipo: 'deposito',
          valor: valorInvestido * (fixoNum / 100),
          destino: 'fixa',
          data: dataAtual
        },
        {
          tipo: 'deposito',
          valor: valorInvestido * (variavelNum / 100),
          destino: 'variavel',
          data: dataAtual
        }
      )
    });

    onLogin(valorInvestido, fixoNum, variavelNum, nomeGrupo, senha);
  };

  const inputClass =
    'w-full px-4 py-3 border-2 border-gray-300 rounded-xl shadow-lg bg-white text-gray-900 font-bold focus:border-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none transition-all';
  const rowClass = 'flex items-center gap-4 mb-4';
  const labelClass = 'w-40 text-right font-bold text-gray-700';

  return (
    <>
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2
          className="text-4xl mb-10 text-center drop-shadow-sm"
          style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '2.0rem' }}
        >
          🎓 Bem-vindo à Plataforma de Simulação de Investimentos
        </h2>

        <div className="bg-gray-50 border-l-4 border-blue-400 p-5 text-sm text-gray-800 rounded mt-4">
          <p className="mb-4 text-justify leading-relaxed">
            Este ambiente foi desenvolvido para <strong>fins educacionais</strong>, permitindo que você simule investimentos em diferentes tipos de ativos e acompanhe sua evolução ao longo do tempo — tudo de forma prática, interativa e em tempo real.
          </p>

          <h3 className="font-bold text-center text-blue-900 text-lg mb-3">
            O que você pode fazer aqui:
          </h3>

          <ul className="list-disc list-inside space-y-2 px-4 text-justify">
            <li>
              Simular aplicações em <strong>Renda Fixa</strong> e <strong>Renda Variável</strong> com valores reais de mercado:
              <ul className="list-disc list-inside pl-6 text-sm mt-1 text-gray-600">
                <li className="italic font-medium">Renda Fixa: Pré-fixada, Pós-fixada e Híbrida.</li>
                <li className="italic font-medium">Renda Variável: Ações, Fundos Imobiliários e Criptomoedas.</li>
              </ul>
            </li>
            <li>
              Acompanhar diariamente a <strong>valorização dos ativos</strong> e analisar o gráfico de desempenho.
            </li>
            <li>
              Realizar <strong>operações fictícias</strong> como compras, vendas, depósitos e lançamento de dividendos.
            </li>
          </ul>

          <div className="bg-violet-100 border-l-4 border-violet-400 p-3 text-sm text-violet-800 rounded mt-4">
            ⚠️ <strong>Atenção:</strong> Este sistema é uma <strong>simulação</strong>. Não utiliza dinheiro real, cartões de crédito nem realiza transações financeiras verdadeiras.
            {/* Modal e botão do tutorial */}
      {mostrarTutorial && (
        <TutorialModal onClose={() => setMostrarTutorial(false)} />
      )}

      <div className="text-center mt-4">
        <Button
          onClick={() => setMostrarTutorial(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow w-full" 
        >
          Ver Tutorial do Simulador
        </Button>
      </div>
          </div>
        </div>

        <div>
          <div className={rowClass}>
            <label className={labelClass}>Nome do Grupo:</label>
            <input
              type="text"
              value={nomeGrupo}
              onChange={(e) => setNomeGrupo(e.target.value)}
              className={inputClass}
              placeholder="Ex: Grupo de Investimento"
              required
            />
          </div>

          {grupoExistente === null && (
            <Button
              onClick={verificarGrupo}
              disabled={verificando}
              className="w-full mt-2"
            >
              {verificando ? 'Verificando...' : (
                <>
                  <UserRoundCheck className="w-5 h-4.5 inline-block mr-1 text-white-600" />
                  Verificar Grupo
                </>
              )}
            </Button>
          )}

          {grupoExistente === false && (
            <form onSubmit={handleSubmit} className="mt-6">
              <div className={rowClass}>
                <label className={labelClass}>Senha Numérica (6 dígitos):</label>
                <input
                  type="password"
                  pattern="\d{6}"
                  inputMode="numeric"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={inputClass}
                  placeholder="******"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 text-left mt-4">
                A senha será utilizada para efetivar suas transações.
              </p>

              <div className={rowClass}>
                <label className={labelClass}>Valor Total:</label>
                <input
                  type="text"
                  value={displayValue}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={rowClass}>
                  <label className={labelClass}>% Renda Fixa:</label>
                  <input
                    type="number"
                    value={fixo}
                    onChange={(e) => setFixo(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: 60"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className={rowClass}>
                  <label className={labelClass}>% Renda Variável:</label>
                  <input
                    type="number"
                    value={variavel}
                    onChange={(e) => setVariavel(e.target.value)}
                    className={inputClass}
                    placeholder="Ex: 40"
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <p className="text-sm text-gray-500 text-left mt-4">
                Obs: A soma deve ser 100%
              </p>

              {erro && <p className="text-red-500 text-sm text-left mt-2">{erro}</p>}

              <Button type="submit" className="w-full mt-4">
                <Power className="w-5 h-4.5 inline-block mr-1" /> Iniciar Simulação
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
