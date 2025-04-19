import { useState, useEffect } from 'react';
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
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import { Ativo } from '../types/Ativo';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface MainPageProps {
  login: string;
  valorInvestido: number;
  fixo: number;
  variavel: number;
  nomeGrupo: string;
}

const MainPage = ({ login, valorInvestido, fixo, variavel, nomeGrupo }: MainPageProps) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [error, setError] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);

  const calcularTotalInvestido = (ativos: Ativo[], tipo: 'rendaFixa' | 'rendaVariavel') => {
    return ativos
      .filter(a => a.tipo === tipo)
      .reduce((total, a) => total + a.valorInvestido, 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);

      let ativos: Ativo[] = [];
      let porcentagemFixa = fixo;
      let porcentagemVariavel = variavel;

      if (docSnap.exists()) {
        const data = docSnap.data();
        ativos = (data.ativos || []).map((a: any) => ({
          ...a,
          patrimonioPorDia: a.patrimonioPorDia || {},
        }));
        porcentagemFixa = data.porcentagemFixa ?? fixo;
        porcentagemVariavel = data.porcentagemVariavel ?? variavel;
      } else {
        await setDoc(docRef, {
          ativos: [],
          porcentagemFixa: fixo,
          porcentagemVariavel: variavel
        });
      }

      setAtivos(ativos);
      setValorFixaDisponivel(valorInvestido * (porcentagemFixa / 100) - calcularTotalInvestido(ativos, 'rendaFixa'));
      setValorVariavelDisponivel(valorInvestido * (porcentagemVariavel / 100) - calcularTotalInvestido(ativos, 'rendaVariavel'));
    };
    fetchData();
  }, [login, valorInvestido, fixo, variavel]);

  useEffect(() => {
    const saveData = async () => {
      const docRef = doc(db, 'usuarios', login);
      try {
        const ativosLimpos = ativos.map((ativo) => {
          const novoAtivo: any = { ...ativo };
          Object.keys(novoAtivo).forEach((key) => {
            if (novoAtivo[key] === undefined) {
              delete novoAtivo[key];
            }
          });
          return novoAtivo;
        });
        await setDoc(docRef, {
          ativos: ativosLimpos,
          porcentagemFixa: fixo,
          porcentagemVariavel: variavel
        }, { merge: true });
      } catch (error) {
        setError('Erro ao salvar dados no Firebase');
        console.error(error);
      }
    };
    if (ativos.length > 0) saveData();
  }, [ativos, login, fixo, variavel]);

  const handleAddAtivo = (ativo: Ativo) => {
    setAtivos((prev) => [...prev, ativo]);
    if (ativo.tipo === 'rendaFixa') {
      setValorFixaDisponivel((prev) => prev - ativo.valorInvestido);
    } else {
      setValorVariavelDisponivel((prev) => prev - ativo.valorInvestido);
    }
  };

  const handleDeleteAtivo = (id: string) => {
    const ativoRemovido = ativos.find((ativo) => ativo.id === id);
    if (ativoRemovido) {
      if (ativoRemovido.tipo === 'rendaFixa') {
        setValorFixaDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      } else {
        setValorVariavelDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      }
    }
    const atualizados = ativos.filter((ativo) => ativo.id !== id);
    setAtivos(atualizados);
  };

  const allDates = Array.from(
    new Set(ativos.flatMap((ativo) => Object.keys(ativo.patrimonioPorDia)))
  ).sort();

  const cores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  const chartData = {
    labels: allDates.map(date => {
      const [ano, mes, dia] = date.split('-');
      return `${dia}/${mes}/${ano}`;
    }),
    datasets: ativos.map((ativo, i) => ({
      label: ativo.nome,
      data: allDates.map((date) => ativo.patrimonioPorDia[date] || 0),
      borderColor: cores[i % cores.length],
      fill: false,
    })),
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monitoramento de Ativos - Grupo: {nomeGrupo}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-yellow-600 mb-4">Salvando...</p>}

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Disponível para Investimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-3 rounded">
            <h3 className="font-medium">Renda Fixa</h3>
            <p className="text-2xl">R$ {valorFixaDisponivel.toFixed(2)}</p>
          </div>
          <div className="border p-3 rounded">
            <h3 className="font-medium">Renda Variável / Criptomoedas</h3>
            <p className="text-2xl">R$ {valorVariavelDisponivel.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowWizard(true)}
        className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        + Adicionar Ativo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ativos.map((ativo) => (
          <AtivoCard key={ativo.id} ativo={ativo} onDelete={handleDeleteAtivo} />
        ))}
      </div>

      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Evolução do Patrimônio</h2>
        <div className="h-64">
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AddAtivoWizard
            onClose={() => setShowWizard(false)}
            onAddAtivo={handleAddAtivo}
            valorFixaDisponivel={valorFixaDisponivel}
            valorVariavelDisponivel={valorVariavelDisponivel}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;