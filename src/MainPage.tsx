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

  const atualizarValoresDisponiveis = (todosAtivos: Ativo[]) => {
    const totalFixa = todosAtivos
      .filter(a => a.tipo === 'rendaFixa')
      .reduce((soma, a) => soma + a.valorInvestido, 0);
    const totalVariavel = todosAtivos
      .filter(a => a.tipo === 'rendaVariavel')
      .reduce((soma, a) => soma + a.valorInvestido, 0);

    setValorFixaDisponivel(valorInvestido * (fixo / 100) - totalFixa);
    setValorVariavelDisponivel(valorInvestido * (variavel / 100) - totalVariavel);
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
          atualizarValoresDisponiveis(data?.ativos || []);
        } else {
          await setDoc(docRef, {
            ativos: [],
            porcentagemFixa: fixo,
            porcentagemVariavel: variavel,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados do Firestore", err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleAddAtivo = async (novoAtivo: Ativo) => {
    const novosAtivos = [...ativos, novoAtivo];
    setAtivos(novosAtivos);
    atualizarValoresDisponiveis(novosAtivos);

    try {
      await updateDoc(doc(db, 'usuarios', login), {
        ativos: novosAtivos
      });
    } catch (err) {
      console.error("Erro ao adicionar ativo", err);
      setError('Erro ao adicionar o ativo');
    }
  };

  const handleDeleteAtivo = async (id: string) => {
    const novosAtivos = ativos.filter(a => a.id !== id);
    setAtivos(novosAtivos);
    atualizarValoresDisponiveis(novosAtivos);

    try {
      await updateDoc(doc(db, 'usuarios', login), {
        ativos: novosAtivos
      });
    } catch (err) {
      console.error("Erro ao remover ativo", err);
      setError('Erro ao remover o ativo');
    }
  };

  const chartData = {
    labels: ativos.map(a => a.nome),
    datasets: [{
      label: 'Valor Investido',
      data: ativos.map(a => a.valorInvestido),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: ativos.map(a => getCorAtivo(a.id)),
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Distribuição dos Ativos' }
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Painel do Grupo: {nomeGrupo}</h1>
        <button
          onClick={() => setShowWizard(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Adicionar Ativo
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white shadow p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Resumo de Investimentos</h2>
          <p>Renda Fixa Disponível: <strong>{formatCurrency(valorFixaDisponivel)}</strong></p>
          <p>Renda Variável Disponível: <strong>{formatCurrency(valorVariavelDisponivel)}</strong></p>
        </div>

        <div className="bg-white shadow p-4 rounded-lg">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
        {ativos.map((ativo) => (
          <AtivoCard
            key={ativo.id}
            ativo={ativo}
            cor={getCorAtivo(ativo.id)}
            onDelete={() => handleDeleteAtivo(ativo.id)}
          />
        ))}
      </div>

      {showWizard && (
        <AddAtivoWizard
        onClose={() => setShowWizard(false)}
        onAddAtivo={handleAddAtivo}
        valorFixaDisponivel={valorFixaDisponivel}
        valorVariavelDisponivel={valorVariavelDisponivel}
        quantidadeAtivos={ativos.length}
        />
      )}
    </div>
  );
};

export default MainPage;
