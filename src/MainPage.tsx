import { useState, useEffect, useMemo } from 'react';
import './index.css'
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { db } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import { Ativo } from './types/Ativo';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CORES_UNICAS = [
  '#2E86AB', '#F18F01', '#73BA9B', '#D95D39', '#587B7F',
  '#1B4965', '#3A7CA5', '#4A6FA5', '#166088', '#5E3023',
  '#895737', '#B88B4A', '#D8C99B', '#D8973C', '#BD632F',
  '#A846A0', '#5C6F68', '#8AA29E', '#6E7DAB', '#00BBF9'
];

interface MainPageProps {
  login: string;
  valorInvestido: number;
  fixo: number;
  variavel: number;
  nomeGrupo: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const MainPage = ({ login, valorInvestido, fixo, variavel, nomeGrupo }: MainPageProps) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const coresAtivos = useMemo(() => {
    const mapeamento: Record<string, string> = {};
    ativos.forEach((ativo, index) => {
      mapeamento[ativo.id] = CORES_UNICAS[index % CORES_UNICAS.length];
    });
    return mapeamento;
  }, [ativos]);

  const getCorAtivo = (ativoId: string) => coresAtivos[ativoId] || CORES_UNICAS[0];

  const calcularTotalInvestido = (tipo: 'rendaFixa' | 'rendaVariavel') => {
    return ativos
      .filter(a => a.tipo === tipo)
      .reduce((total, a) => total + a.valorInvestido, 0);
  };

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'usuarios', login);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setAtivos(data?.ativos || []);
        } else {
          await setDoc(docRef, {
            ativos: [],
            porcentagemFixa: fixo,
            porcentagemVariavel: variavel
          });
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [login, fixo, variavel]);

  useEffect(() => {
    setValorFixaDisponivel(valorInvestido * (fixo / 100) - calcularTotalInvestido('rendaFixa'));
    setValorVariavelDisponivel(valorInvestido * (variavel / 100) - calcularTotalInvestido('rendaVariavel'));
  }, [ativos, valorInvestido, fixo, variavel]);

  const handleAddAtivo = async (novoAtivo: Ativo) => {
    try {
      setAtivos(prev => [...prev, novoAtivo]);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, {
        ativos: [...ativos, novoAtivo]
      });
    } catch (err) {
      setError('Erro ao adicionar ativo');
      console.error(err);
    }
  };

  const handleVenderAtivo = async (id: string, quantidade: number) => {
    try {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const ativosUsuario: Ativo[] = data?.ativos || [];
      const ativo = ativosUsuario.find(a => a.id === id);
      if (!ativo) return;

      if (ativo.tipo === 'rendaFixa') {
        const novosAtivos = ativosUsuario.filter(a => a.id !== id);
        setAtivos(novosAtivos);
        await updateDoc(docRef, { ativos: novosAtivos });
        return;
      }

      if ('quantidade' in ativo) {
        const novaQuantidade = ativo.quantidade - quantidade;

        if (novaQuantidade <= 0) {
          const novosAtivos = ativosUsuario.filter(a => a.id !== id);
          setAtivos(novosAtivos);
          await updateDoc(docRef, { ativos: novosAtivos });
        } else {
          const novoValorInvestido = novaQuantidade * ativo.valorAtual;
          const ativosAtualizados = ativosUsuario.map(a => {
            if (a.id === id) {
              return {
                ...a,
                quantidade: novaQuantidade,
                valorInvestido: novoValorInvestido
              };
            }
            return a;
          });
          setAtivos(ativosAtualizados);
          await updateDoc(docRef, { ativos: ativosAtualizados });
        }
      }
    } catch (err) {
      setError('Erro ao vender ativo');
      console.error(err);
    }
  };

  const allDates = Array.from(
    new Set(ativos.flatMap(a => Object.keys(a.patrimonioPorDia)))
  ).sort();

  const chartData = {
    labels: allDates.map(date => {
      const [ano, mes, dia] = date.split('-');
      return `${dia}/${mes}/${ano}`;
    }),
    datasets: ativos.map(ativo => ({
      label: ativo.nome,
      data: allDates.map(date => ativo.patrimonioPorDia[date] || 0),
      borderColor: getCorAtivo(ativo.id),
      backgroundColor: getCorAtivo(ativo.id) + '80',
      borderWidth: 2,
      tension: 0.1,
      pointRadius: 4
    }))
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monitoramento de Ativos - Grupo: {nomeGrupo}</h1>
      
      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-lg mb-4">
          Carregando...
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-lg mb-6 border-2 border-gray-200">
        <h2 className="text-xl font-semibold mb-3">Disponível para Investimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <h3 className="font-medium text-gray-700">Renda Fixa</h3>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(valorFixaDisponivel)}
            </p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <h3 className="font-medium text-gray-700">Renda Variável / Criptomoedas</h3>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(valorVariavelDisponivel)}
            </p>
          </div>
        </div>
      </div>

      <button
       onClick={() => setShowWizard(true)}
       className="mb-6 bg-blue-600 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 border-4 border-blue-600 hover:border-blue-800 shadow-lg"
       >
       + Adicionar Ativo
       </button>

      {ativos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ativos.map(ativo => (
              <AtivoCard 
                key={ativo.id} 
                ativo={ativo} 
                onVender={handleVenderAtivo}
                cor={getCorAtivo(ativo.id)}
              />
            ))}
          </div>

          <div className="mt-8 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Evolução do Patrimônio</h2>
            <div className="h-64">
              <Line 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          return ` ${context.dataset.label}: ${formatCurrency(Number(context.raw))}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: (value) => {
                          return formatCurrency(Number(value));
                        }
                      }
                    }
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {ativos.map(ativo => (
                <div key={ativo.id} className="flex items-center bg-gray-50 px-3 py-2 rounded-full border-2 border-gray-200">
                  <div 
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: getCorAtivo(ativo.id) }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {ativo.nome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
          Nenhum ativo cadastrado. Adicione seu primeiro ativo para começar.
        </div>
      )}

      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddAtivoWizard
            onClose={() => setShowWizard(false)}
            onAddAtivo={handleAddAtivo}
            valorFixaDisponivel={valorFixaDisponivel}
            valorVariavelDisponivel={valorVariavelDisponivel}
            quantidadeAtivos={ativos.length}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;
