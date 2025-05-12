import { useEffect, useMemo, useState } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import VendaAtivoModal from './components/VendaAtivoModal'; // Importando o modal de venda
import { Ativo, RendaVariavelAtivo, RendaFixaAtivo } from './types/Ativo';
import Button from './components/Button';


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

export default function MainPage({ login, valorInvestido, fixo, variavel, nomeGrupo }: MainPageProps) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [ativoSelecionado, setAtivoSelecionado] = useState<Ativo | null>(null); // 🔵 Modal de venda
  const [showVendaModal, setShowVendaModal] = useState(false);

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
      const novosAtivos = [...ativos, novoAtivo];
      setAtivos(novosAtivos);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, { ativos: novosAtivos });
    } catch (err) {
      setError('Erro ao adicionar ativo');
      console.error(err);
    }
  };

  const handleSellAtivo = (id: string) => {
    const ativo = ativos.find(a => a.id === id);
    if (!ativo) return;
    setAtivoSelecionado(ativo);
    setShowVendaModal(true);
  };

  const confirmarVenda = async (quantidadeVendida: number) => {
    if (!ativoSelecionado) return;

    if (ativoSelecionado.tipo === 'rendaFixa') {
      // Venda total da renda fixa
      setValorFixaDisponivel(prev => prev + ativoSelecionado.valorAtual);
      const ativosRestantes = ativos.filter(a => a.id !== ativoSelecionado.id);
      setAtivos(ativosRestantes);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, { ativos: ativosRestantes });
    } else {
      // Venda parcial ou total de renda variável
      const ativoVar = ativoSelecionado;

      const valorVenda = quantidadeVendida * ativoVar.valorAtual;
      setValorVariavelDisponivel(prev => prev + valorVenda);

      if (quantidadeVendida === ativoVar.quantidade) {
        // Venda total
        const ativosRestantes = ativos.filter(a => a.id !== ativoVar.id);
        setAtivos(ativosRestantes);

        const docRef = doc(db, 'usuarios', login);
        await updateDoc(docRef, { ativos: ativosRestantes });
      } else {
        // Venda parcial
        const ativosAtualizados = ativos.map(a => {
          if (a.id === ativoVar.id && a.tipo === 'rendaVariavel') {
            const ativoVariavel = a as RendaVariavelAtivo; // forçando tipo seguro
            const novaQuantidade = ativoVariavel.quantidade - quantidadeVendida;
            const novoValorInvestido = novaQuantidade * ativoVariavel.valorAtual;
            return {
              ...ativoVariavel,
              quantidade: novaQuantidade,
              valorInvestido: novoValorInvestido,
            };
          }
          return a;
        });
        setAtivos(ativosAtualizados);

        const docRef = doc(db, 'usuarios', login);
        await updateDoc(docRef, { ativos: ativosAtualizados });
      }
    }

    setShowVendaModal(false);
    setAtivoSelecionado(null);
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
      <h1 className="text-2xl font-bold mb-8 text-center">
        Monitoramento de Ativos - Grupo: {nomeGrupo}
      </h1>
  
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
  
      <div className="bg-white p-4 rounded-lg shadow-lg mb-6 border-2 border-gray-200 text-left">
        <h2 className="text-xl font-semibold mb-4">Disponível para Investimento</h2>
  
        <div className="space-y-3">
          <div className="flex justify-start items-center gap-4">
            <span className="font-medium text-gray-700 w-72">Renda Fixa</span>
            <span className="text-lg font-bold text-gray-800">
              {formatCurrency(valorFixaDisponivel)}
            </span>
          </div>
          <div className="flex justify-start items-center gap-4">
            <span className="font-medium text-gray-700 w-72">Renda Variável / Criptomoedas</span>
            <span className="text-lg font-bold text-gray-800">
              {formatCurrency(valorVariavelDisponivel)}
            </span>
          </div>
        </div>
      </div>
  
      <div className="text-center">
        <Button onClick={() => setShowWizard(true)} className="mb-6">
          + Adicionar Ativo
        </Button>
      </div>
  
      {ativos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ativos.map(ativo => (
              <AtivoCard 
                key={ativo.id} 
                ativo={ativo} 
                onSell={handleSellAtivo} 
                cor={getCorAtivo(ativo.id)}
              />
            ))}
          </div>
  
          <div className="mt-8 bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Evolução do Patrimônio</h2>
            <div className="h-64">
              <Line data={chartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => ` ${context.dataset.label}: ${formatCurrency(Number(context.raw))}`
                    }
                  }
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => formatCurrency(Number(value))
                    }
                  }
                }
              }} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
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
  
      {showVendaModal && ativoSelecionado && (
        <VendaAtivoModal 
          ativo={ativoSelecionado}
          onClose={() => setShowVendaModal(false)}
          onConfirm={confirmarVenda}
        />
      )}
    </div>
  );
}
