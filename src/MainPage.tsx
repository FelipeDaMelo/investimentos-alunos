import { useState, useEffect, useMemo } from 'react';
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
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import { Ativo, GrupoInvestimento } from './types/Ativo';
import useAtualizarHistorico from './hooks/useAtualizarHistorico';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CORES_UNICAS = [
  '#2E86AB', '#F18F01', '#73BA9B', '#D95D39', '#587B7F',
  '#1B4965', '#3A7CA5', '#4A6FA5', '#166088', '#5E3023',
  '#895737', '#B88B4A', '#D8C99B', '#D8973C', '#BD632F',
  '#A846A0', '#5C6F68', '#8AA29E', '#6E7DAB', '#00BBF9'
];

interface MainPageProps {
  grupo: GrupoInvestimento;
  onLogout: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const MainPage = ({ grupo, onLogout }: MainPageProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [grupoLocal, setGrupoLocal] = useState<GrupoInvestimento>(grupo);

  const coresAtivos = useMemo(() => {
    const mapeamento: Record<string, string> = {};
    grupoLocal.ativos.forEach((ativo, index) => {
      mapeamento[ativo.id] = CORES_UNICAS[index % CORES_UNICAS.length];
    });
    return mapeamento;
  }, [grupoLocal.ativos]);

  const getCorAtivo = (ativoId: string) => coresAtivos[ativoId] || CORES_UNICAS[0];

  const calcularTotalInvestido = (tipo: 'rendaFixa' | 'rendaVariavel') => {
    return grupoLocal.ativos
      .filter(a => a.tipo === tipo)
      .reduce((total, a) => total + a.valorInvestido, 0);
  };

  const valorFixaDisponivel = grupoLocal.valorTotalInvestido * (grupoLocal.porcentagemRendaFixa / 100) - calcularTotalInvestido('rendaFixa');
  const valorVariavelDisponivel = grupoLocal.valorTotalInvestido * (grupoLocal.porcentagemRendaVariavel / 100) - calcularTotalInvestido('rendaVariavel');

  const handleAddAtivo = async (novoAtivo: Ativo) => {
    try {
      setLoading(true);
      const updatedAtivos = [...grupoLocal.ativos, novoAtivo];
      const docRef = doc(db, 'gruposInvestimento', grupoLocal.nome.toLowerCase().replace(/\s+/g, '-'));
      
      await updateDoc(docRef, {
        ativos: updatedAtivos
      });
      
      setGrupoLocal(prev => ({
        ...prev,
        ativos: updatedAtivos
      }));
    } catch (err) {
      setError('Erro ao adicionar ativo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAtivo = async (id: string) => {
    try {
      setLoading(true);
      const updatedAtivos = grupoLocal.ativos.filter(a => a.id !== id);
      const docRef = doc(db, 'gruposInvestimento', grupoLocal.nome.toLowerCase().replace(/\s+/g, '-'));
      
      await updateDoc(docRef, {
        ativos: updatedAtivos
      });
      
      setGrupoLocal(prev => ({
        ...prev,
        ativos: updatedAtivos
      }));
    } catch (err) {
      setError('Erro ao remover ativo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useAtualizarHistorico(grupoLocal.nome.toLowerCase().replace(/\s+/g, '-'), grupoLocal.ativos);

  const chartData = {
    labels: grupoLocal.historicoPatrimonio.map(item => {
      const [ano, mes, dia] = item.data.split('-');
      return `${dia}/${mes}`;
    }),
    datasets: [
      {
        label: 'Patrimônio Total',
        data: grupoLocal.historicoPatrimonio.map(item => item.valorTotal),
        borderColor: '#4F46E5',
        backgroundColor: '#4F46E520',
        borderWidth: 2,
        tension: 0.1
      },
      ...grupoLocal.ativos.map(ativo => ({
        label: ativo.nome,
        data: grupoLocal.historicoPatrimonio.map(item => item.detalhesAtivos[ativo.id] || 0),
        borderColor: getCorAtivo(ativo.id),
        backgroundColor: getCorAtivo(ativo.id) + '80',
        borderWidth: 1,
        hidden: true
      }))
    ]
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Monitoramento - {grupoLocal.nome}</h1>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Sair do Grupo
        </button>
      </div>
      
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
            <p className="text-sm text-gray-500 mt-1">
              {grupoLocal.porcentagemRendaFixa}% do total
            </p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <h3 className="font-medium text-gray-700">Renda Variável</h3>
            <p className="text-2xl font-bold text-gray-800">
              {formatCurrency(valorVariavelDisponivel)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {grupoLocal.porcentagemRendaVariavel}% do total
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowWizard(true)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors border-2 border-blue-600 hover:border-blue-700"
      >
        + Adicionar Ativo
      </button>

      {grupoLocal.ativos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {grupoLocal.ativos.map(ativo => (
              <AtivoCard 
                key={ativo.id} 
                ativo={ativo} 
                onDelete={handleDeleteAtivo}
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
              <div className="flex items-center bg-gray-50 px-3 py-2 rounded-full border-2 border-gray-200">
                <div className="w-4 h-4 rounded-full mr-2 bg-indigo-600"></div>
                <span className="text-sm font-medium text-gray-700">Total</span>
              </div>
              {grupoLocal.ativos.map(ativo => (
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
            quantidadeAtivos={grupoLocal.ativos.length}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;