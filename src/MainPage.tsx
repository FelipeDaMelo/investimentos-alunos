import { useEffect, useMemo, useState } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';
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
import DepositarModal from './components/DepositarModal';
import HistoricoModal from './components/HistoricoModal';
import { AtivoComSenha } from '../src/types/Ativo';


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
  senha: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function MainPage({ login, valorInvestido, fixo, variavel, nomeGrupo }: Omit<MainPageProps, 'senha'>) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [ativoSelecionado, setAtivoSelecionado] = useState<Ativo | null>(null); // 🔵 Modal de venda
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [showDepositar, setShowDepositar] = useState(false);
  const [depositoFixa, setDepositoFixa] = useState(0);
  const [depositoVariavel, setDepositoVariavel] = useState(0);
  const [totalDepositado, setTotalDepositado] = useState(0);
  const [historico, setHistorico] = useState([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState('');


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
          setTotalDepositado(data?.totalDepositado || 0);
          setDepositoFixa(data?.depositoFixa || 0);
          setDepositoVariavel(data?.depositoVariavel || 0);
          setHistorico(data?.historico || []);
          setSenhaSalva(data?.senha || '');
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
  const valorFixaInicial = valorInvestido * (fixo / 100);
  const valorVariavelInicial = valorInvestido * (variavel / 100);

  const totalFixa = valorFixaInicial + depositoFixa;
  const totalVariavel = valorVariavelInicial + depositoVariavel;

  setValorFixaDisponivel(totalFixa - calcularTotalInvestido('rendaFixa'));
  setValorVariavelDisponivel(totalVariavel - calcularTotalInvestido('rendaVariavel'));
}, [ativos, valorInvestido, fixo, variavel, depositoFixa, depositoVariavel]);

const handleDeposito = async (
  valor: number,
  destino: 'fixa' | 'variavel',
  senhaDigitada: string
): Promise<boolean> => {
  if (senhaDigitada !== senhaSalva) {
    alert('Senha incorreta!');
    return false;
  }
  const docRef = doc(db, 'usuarios', login);

  if (destino === 'fixa') {
    setDepositoFixa(prev => prev + valor);
    await updateDoc(docRef, {
      depositoFixa: depositoFixa + valor,
      historico: arrayUnion({
    tipo: 'deposito',
    valor,
    destino,
    data: new Date().toISOString()
  }),
    });
    
  } else {
    setDepositoVariavel(prev => prev + valor);
    await updateDoc(docRef, {
      depositoVariavel: depositoVariavel + valor,
      historico: arrayUnion({
    tipo: 'deposito',
    valor,
    destino,
    data: new Date().toISOString()
  }),
    });
  }
  return true;
};



    const handleAddAtivo = async (novoAtivo: AtivoComSenha) => {
if (novoAtivo.senha !== senhaSalva) {
  alert('Senha incorreta!');
  return false; // <- agora retorna explicitamente false
}

const {
  senha: _,
  ...resto
} = novoAtivo;

const ativoSemSenha: Ativo = {
  ...(resto as Ativo)
};
    try {
      let novosAtivos: Ativo[];
  
      if (novoAtivo.tipo === 'rendaVariavel') {
        const existente = ativos.find(
          a => a.tipo === 'rendaVariavel' && (a as RendaVariavelAtivo).tickerFormatado === (novoAtivo as RendaVariavelAtivo).tickerFormatado
        ) as RendaVariavelAtivo | undefined;
  
        if (existente) {
          const novaQuantidade = existente.quantidade + (novoAtivo as RendaVariavelAtivo).quantidade;
          const novoInvestimento = existente.valorInvestido + novoAtivo.valorInvestido;
          const novoPrecoMedio = novoInvestimento / novaQuantidade;
  
          const atualizado: RendaVariavelAtivo = {
            ...existente,
            quantidade: novaQuantidade,
            valorInvestido: novoInvestimento,
            valorAtual: novoPrecoMedio,
            patrimonioPorDia: {
              ...existente.patrimonioPorDia,
              [new Date().toISOString().split('T')[0]]: novaQuantidade * novoPrecoMedio
            }
          };
  
          novosAtivos = ativos.map(a =>
            a.id === existente.id ? atualizado : a
          );
        } else {
          novosAtivos = [...ativos, ativoSemSenha];
        }
      } else {
        novosAtivos = [...ativos, ativoSemSenha];
      }
  
      setAtivos(novosAtivos);
  
      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, { ativos: novosAtivos });
      await updateDoc(docRef, {
  historico: arrayUnion({
    tipo: 'compra',
    valor: novoAtivo.valorInvestido,
    nome: novoAtivo.nome,
    categoria: novoAtivo.tipo,
    data: new Date().toISOString()
  })
});
    return true;
    } catch (err) {
      setError('Erro ao adicionar ativo');
      console.error(err);
      return false;
    }
  };
  

  const handleSellAtivo = (id: string) => {
    const ativo = ativos.find(a => a.id === id);
    if (!ativo) return;
    setAtivoSelecionado(ativo);
    setShowVendaModal(true);
  };

const confirmarVenda = async (quantidadeVendida: number, senhaDigitada: string) => {
  if (senhaDigitada !== senhaSalva) {
    alert('Senha incorreta!');
    return;
  }

    if (!ativoSelecionado) return;

    if (ativoSelecionado.tipo === 'rendaFixa') {
      // Venda total da renda fixa
      setValorFixaDisponivel(prev => prev + ativoSelecionado.valorAtual);
      const ativosRestantes = ativos.filter(a => a.id !== ativoSelecionado.id);
      setAtivos(ativosRestantes);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, { ativos: ativosRestantes });
      await updateDoc(docRef, {
  historico: arrayUnion({
    tipo: 'venda',
    valor: quantidadeVendida * ativoSelecionado.valorAtual,
    nome: ativoSelecionado.nome,
    categoria: ativoSelecionado.tipo,
    data: new Date().toISOString()
  })
});
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
        await updateDoc(docRef, {
  historico: arrayUnion({
    tipo: 'venda',
    valor: quantidadeVendida * ativoSelecionado.valorAtual,
    nome: ativoSelecionado.nome,
    categoria: ativoSelecionado.tipo,
    data: new Date().toISOString()
  })
});
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
  
<div className="relative bg-white p-4 rounded-lg shadow-lg mb-6 border-2 border-gray-200 text-left">
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

  {/* Botão fixo no canto superior direito do box */}
  <div className="absolute top-4 right-4">
    <Button
      onClick={() => setShowDepositar(true)}
      className="bg-green-600 hover:bg-green-700 text-white shadow"
    >
      + Depositar
    </Button>
  </div>
  <div className="absolute bottom-4 right-4">
    <Button
      onClick={() => setShowHistorico(true)}
      className="bg-red-600 hover:bg-red-700 text-white shadow"
    >
      + Ver Extrato
    </Button>
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

      {showDepositar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <DepositarModal
            onClose={() => setShowDepositar(false)}
            onConfirm={handleDeposito}
          />
        </div>
      )}

      {showHistorico && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <HistoricoModal
      historico={historico}
      onClose={() => setShowHistorico(false)}
    />
  </div>
)}
    </div>
   );
}
