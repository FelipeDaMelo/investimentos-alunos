import { useEffect, useMemo, useState } from 'react';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { arrayUnion } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale, // ✅ Corrigir este import
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
Chart.register(zoomPlugin);
import { useRef } from 'react';
import { formatarDataHoraBr } from './utils/formatarDataHora';
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import VendaAtivoModal from './components/VendaAtivoModal'; // Importando o modal de venda
import { Ativo, RendaVariavelAtivo, RendaFixaAtivo } from './types/Ativo';
import Button from './components/Button';
import DepositarModal from './components/DepositarModal';
import TransferenciaModal from './components/TransferenciaModal';
import HistoricoModal from './components/HistoricoModal';
import InformarDividendoModal from './components/InformarDividendoModal';
import AtualizarInvestimentosModal from './components/AtualizarInvestimentosModal';
import { AtivoComSenha } from '../src/types/Ativo';
import useAtualizarAtivos from './hooks/useAtualizarAtivos';
import { atualizarAtivos } from './utils/atualizarAtivos';
import { obterUltimaAtualizacaoManual, salvarUltimaAtualizacaoManual } from './hooks/useAtualizarAtivos';
import FotoGrupoUploader from './components/FotoGrupoUploader';
import { CircleArrowUp, CircleArrowDown } from 'lucide-react';
import { Wallet,Receipt, ArrowRightLeft, ReceiptText, Calculator, SquarePlus,RefreshCw, Download  } from 'lucide-react'; // certifique-se de importar esse ícone também
import { verificarImpostoMensal } from './hooks/verificarImpostoMensal';
import { ResumoIR } from './components/ResumoIR';
import DeduzirIRModal from './components/DeduzirIRModal';
import { calcularSaldoVariavel } from './utils/ativoHelpers';


ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend);

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

interface RegistroHistorico {
  tipo: 'compra' | 'venda' | 'deposito' | 'dividendo' | 'transferencia'| 'ir';
  valor: number;
  nome?: string;
  destino?: 'fixa' | 'variavel';
  categoria?: 'rendaFixa' | 'rendaVariavel';
   subtipo?: 'acao' | 'fii' | 'criptomoeda'; // ⬅️ necessário para o cálculo de IR
  data: string;
  valorBruto?: number;
  valorLiquido?: number;
  imposto?: number;
  diasAplicado?: number;
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
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);  
  const [showHistorico, setShowHistorico] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState('');
const [showDividendoModal, setShowDividendoModal] = useState(false);
const [ativoDividendo, setAtivoDividendo] = useState<RendaVariavelAtivo | null>(null);
const [bloqueado, setBloqueado] = useState(false);
const [showAtualizarModal, setShowAtualizarModal] = useState(false);
const [ativoInvestimento, setAtivoInvestimento] = useState<RendaFixaAtivo | null>(null);
const [showInvestirModal, setShowInvestirModal] = useState(false);
const [fotoGrupo, setFotoGrupo] = useState<string | null>(null);
const [showTransferencia, setShowTransferencia] = useState(false);
const [escalaY, setEscalaY] = useState<'linear' | 'logarithmic'>('linear');
const [resgatesFixa, setResgatesFixa] = useState(0);
const [resumosIR, setResumosIR] = useState<ResumoIR[] | null>(null);
const [mostrarModalIR, setMostrarModalIR] = useState(false);


const chartRef = useRef<Chart<'line'> | null>(null);
useEffect(() => {
  if (ativos.length === 0) return;

  useAtualizarAtivos(ativos, async (ativosAtualizados) => {
    setAtivos(ativosAtualizados);
    const docRef = doc(db, 'usuarios', login);
    await updateDoc(docRef, { ativos: ativosAtualizados });
  }, login);
}, [login]);


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
          setFotoGrupo(data?.fotoGrupo || null);
          setAtivos(data?.ativos || []);
          setTotalDepositado(data?.totalDepositado || 0);
          setDepositoFixa(data?.depositoFixa || 0);
          setDepositoVariavel(data?.depositoVariavel || 0);
          setHistorico((data?.historico || []) as RegistroHistorico[]);
          const saldoCalculado = calcularSaldoVariavel(data?.historico || []);
          setValorVariavelDisponivel(saldoCalculado);
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
  const carregarResgates = async () => {
    const docRef = doc(db, 'usuarios', login);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setResgatesFixa(data?.resgatesFixa || 0); // 👈 valor resgatado anteriormente
    }
  };
  carregarResgates();
}, [login]);


useEffect(() => {
  const valorFixaInicial = valorInvestido * (fixo / 100);
  const valorVariavelInicial = valorInvestido * (variavel / 100);

  const totalFixa = valorFixaInicial + depositoFixa;
  const totalVariavel = valorVariavelInicial + depositoVariavel;

  const disponivelFixa = totalFixa - calcularTotalInvestido('rendaFixa') + resgatesFixa;
  const disponivelVariavel = totalVariavel - calcularTotalInvestido('rendaVariavel');

  setValorFixaDisponivel(disponivelFixa);
  setValorVariavelDisponivel(disponivelVariavel);
}, [ativos, valorInvestido, fixo, variavel, depositoFixa, depositoVariavel, resgatesFixa]);

useEffect(() => {
  const novoSaldoVariavel = calcularSaldoVariavel(historico);
  setValorVariavelDisponivel(novoSaldoVariavel);
}, [historico]);

useEffect(() => {
  async function verificarBloqueio() {
    const ultima = await obterUltimaAtualizacaoManual(login);
    if (ultima) {
      const agora = new Date();
      const diff = (agora.getTime() - ultima.getTime()) / 60000;
      if (diff < 30) {
        setBloqueado(true);
        setTimeout(() => setBloqueado(false), (30 - diff) * 60000);
      }
    }
  }

  verificarBloqueio();
}, [login]);

const handleInformarDividendo = (ativo: RendaVariavelAtivo) => {
  setAtivoDividendo(ativo);
  setShowDividendoModal(true);
};

const confirmarDividendo = async (valor: number, senhaDigitada: string) => {
  if (senhaDigitada !== senhaSalva) {
    alert('Senha incorreta!');
    return;
  }

  if (!ativoDividendo) return;

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

const jaTemDividendoEsteMes = historico.some(
  (h: RegistroHistorico) =>
    h.tipo === 'dividendo' &&
    h.nome === ativoDividendo.nome &&
    new Date(h.data).getMonth() === mesAtual &&
    new Date(h.data).getFullYear() === anoAtual
);

  if (jaTemDividendoEsteMes) {
    alert('Dividendo já registrado para este FII neste mês.');
    return;
  }

  if (hoje.getDate() < 15) {
    alert('Os dividendos só podem ser informados após o dia 15 do mês.');
    return;
  }

  const docRef = doc(db, 'usuarios', login);
  const total = valor * ativoDividendo.quantidade;

  setValorVariavelDisponivel(prev => prev + total);

  await updateDoc(docRef, {
  depositoVariavel: depositoVariavel + total,
  historico: arrayUnion({
    tipo: 'dividendo',
    valor: total,
    nome: ativoDividendo.nome,
    data: hoje.toISOString()
  })
});

setHistorico(prev => [
  ...prev,
  {
    tipo: 'dividendo',
    valor: total,
    nome: ativoDividendo.nome,
    data: hoje.toISOString()
  }
]);

  setShowDividendoModal(false);
  setAtivoDividendo(null);
};


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

  const novoRegistro: RegistroHistorico = {
    tipo: 'deposito',
    valor,
    destino,
    data: new Date().toISOString(),
  };

  const campoDeposito = destino === 'fixa' ? 'depositoFixa' : 'depositoVariavel';
  const setDeposito = destino === 'fixa' ? setDepositoFixa : setDepositoVariavel;
  const valorAtual = destino === 'fixa' ? depositoFixa : depositoVariavel;

  setDeposito(prev => prev + valor);

  await updateDoc(docRef, {
    [campoDeposito]: valorAtual + valor,
    historico: arrayUnion(novoRegistro),
  });

  setHistorico(prev => [...prev, novoRegistro]);

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

const novoRegistro: RegistroHistorico = {
  tipo: 'compra',
  valor: novoAtivo.valorInvestido,
  nome: novoAtivo.nome,
  categoria: novoAtivo.tipo,
  data: new Date().toISOString()
};

await updateDoc(docRef, {
  historico: arrayUnion(novoRegistro)
});
setHistorico(prev => [...prev, novoRegistro]);


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
  const { calcularImpostoRenda } = await import('./hooks/calcularImpostoRenda');

  const resultadoIR = calcularImpostoRenda(
    ativoSelecionado.dataInvestimento,
    ativoSelecionado.valorInvestido,
    ativoSelecionado.valorAtual,
  );

  // ✅ Soma o valor resgatado ao controle separado e persiste no Firestore
const lucroLiquido = resultadoIR.lucro - resultadoIR.imposto;

setResgatesFixa(prev => {
  const novoValor = prev + lucroLiquido;
  updateDoc(doc(db, 'usuarios', login), { resgatesFixa: novoValor });
  return novoValor;
});

  // ✅ Remove o ativo da carteira
  const ativosRestantes = ativos.filter(a => a.id !== ativoSelecionado.id);
  setAtivos(ativosRestantes);

  const docRef = doc(db, 'usuarios', login);
  await updateDoc(docRef, { ativos: ativosRestantes });

  // ✅ Registro da venda com campos extras
  const registroVenda: RegistroHistorico = {
    tipo: 'venda',
    valor: resultadoIR.valorLiquido,
    valorBruto: ativoSelecionado.valorAtual,
    valorLiquido: resultadoIR.valorLiquido,
    imposto: resultadoIR.imposto,
    diasAplicado: resultadoIR.diasAplicado,
    nome: ativoSelecionado.nome,
    categoria: 'rendaFixa',
    data: new Date().toISOString()
  };

  await updateDoc(docRef, {
    historico: arrayUnion(registroVenda)
  });

  setHistorico(prev => [...prev, registroVenda]);

  setShowVendaModal(false);
  setAtivoSelecionado(null);
}
 else {
      // Venda parcial ou total de renda variável
      const ativoVar = ativoSelecionado;
      const valorVenda = quantidadeVendida * ativoVar.valorAtual;
      setValorVariavelDisponivel(prev => prev + valorVenda);
      const novaQuantidade = ativoVar.quantidade - quantidadeVendida;

if (Math.abs(novaQuantidade) < 1e-8) {
  // Venda total (inclusive se restar ~0)
  const ativosRestantes = ativos.filter(a => a.id !== ativoVar.id);
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
      const novoRegistro: RegistroHistorico = {
  tipo: 'venda',
  valor: quantidadeVendida * ativoSelecionado.valorAtual,
  nome: ativoSelecionado.nome,
  categoria: ativoSelecionado.tipo,
  data: new Date().toISOString()
};
setHistorico(prev => [...prev, novoRegistro]);
      
} else {
  // Venda parcial
  const ativosAtualizados = ativos.map(a => {
    if (a.id === ativoVar.id && a.tipo === 'rendaVariavel') {
      const ativoVariavel = a as RendaVariavelAtivo;
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
  
  const novoRegistro: RegistroHistorico = {
  tipo: 'venda',
  valor: quantidadeVendida * ativoSelecionado.valorAtual,
  nome: ativoSelecionado.nome,
  categoria: ativoSelecionado.tipo,
  data: new Date().toISOString()
};
setHistorico(prev => [...prev, novoRegistro]);
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
  data: allDates.map(date => ativo.patrimonioPorDia?.[date] ?? 0),
  borderColor: getCorAtivo(ativo.id),
  backgroundColor: getCorAtivo(ativo.id) + '33', // opacidade leve
  borderWidth: 3,
  pointRadius: 3,
  pointHoverRadius: 5,
}))
  };

const todosValores = chartData.datasets.flatMap(ds => ds.data).filter(v => v > 0);
const menorValor = Math.min(...todosValores);
const maiorValor = Math.max(...todosValores);
const minY: number = Math.max(menorValor * 0.5, 0.01);
const maxY: number = maiorValor * 1.2;

// Novo cálculo de valor total e valorização
const valorTotalAtual = useMemo(() => {
  const valorAtivos = ativos.reduce((total, ativo) => {
    const dataHoje = new Date().toISOString().split('T')[0];

    if (ativo.tipo === 'rendaVariavel') {
      const ativoRV = ativo as RendaVariavelAtivo;
      return total + (ativoRV.patrimonioPorDia?.[dataHoje] ?? ativoRV.valorAtual * ativoRV.quantidade);
    }

    return total + (ativo.patrimonioPorDia?.[dataHoje] ?? ativo.valorAtual);
  }, 0);

  return valorAtivos + valorFixaDisponivel + valorVariavelDisponivel;
}, [ativos, valorFixaDisponivel, valorVariavelDisponivel]);
const variacaoPercentual = useMemo(() => {
  const ganho = valorTotalAtual - valorInvestido;
  return (ganho / valorInvestido) * 100;
}, [valorTotalAtual, valorInvestido]);

  return (
    
    <div className="p-4 max-w-6xl mx-auto">
<div className="flex items-center justify-between mb-8 flex-wrap">
  <FotoGrupoUploader login={login} fotoUrlAtual={fotoGrupo || undefined} />

  <h1 className="text-xl md:text-2xl font-bold text-center flex-1">
    Painel de Investimentos - Grupo: {nomeGrupo}
  </h1>

  <div className="w-20" /> {/* Espaço vazio para alinhar como a imagem */}
</div>
  
      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-x1 mb-4">
          {error}
        </div>
      )}
  
      {loading && (
        <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-x1 mb-4">
          Carregando...
        </div>
      )}
  
<div className="relative bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-gray-200 text-left min-h-[220px]">
  <h2 className="text-xl font-semibold mb-4">Saldo Disponível para Novos Investimentos</h2>

  {/* Blocos de saldo com layout consistente */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {/* Renda Fixa */}
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-sm w-full sm:w-[220px]">
      <span className="text-gray-700 text-xs font-semibold uppercase tracking-wide mb-1 block">
        Renda Fixa
      </span>
      <span className="text-lg font-bold text-gray-800">
        {formatCurrency(valorFixaDisponivel)}
      </span>
    </div>

    {/* Renda Variável */}
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-sm w-full sm:w-[220px]">
      <span className="text-gray-700 text-xs font-semibold uppercase tracking-wide mb-1 block">
        Renda Variável / Criptomoedas
      </span>
      <span className="text-lg font-bold text-gray-800">
        {formatCurrency(valorVariavelDisponivel)}
      </span>
    </div>

    {/* Valor total da carteira */}
    <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 shadow-sm w-full sm:w-[220px]">
      <div className="flex items-center gap-1 text-blue-800 font-semibold uppercase tracking-wide text-xs mb-1">
        <Wallet className="w-5 h-4.5" />
        <span>Valor total da carteira</span>
      </div>
      <div className="text-gray-900 text-lg font-bold">
        {formatCurrency(valorTotalAtual)}
      </div>
      <div className={`text-sm font-semibold flex items-center ${variacaoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {variacaoPercentual >= 0 ? (
          <>
            <CircleArrowUp className="w-4 h-4 mr-1" />
            {Math.abs(variacaoPercentual).toFixed(2)}%
          </>
        ) : (
          <>
            <CircleArrowDown className="w-4 h-4 mr-1" />
            {Math.abs(variacaoPercentual).toFixed(2)}%
          </>
        )}
      </div>
    </div>
  </div>

  {/* Botões fixos no canto superior direito */}
<div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:container mx-auto mt-4">
  <Button
    onClick={() => setShowDepositar(true)}
    className="bg-green-600 hover:bg-green-700 text-white shadow w-full sm:w-auto"
  >
    <Receipt className="w-5 h-4.5 inline-block mr-1" /> Depositar
  </Button>

  <Button
    onClick={() => setShowTransferencia(true)}
    className="bg-orange-600 hover:bg-orange-700 text-white shadow w-full sm:w-auto"
  >
    <ArrowRightLeft className="w-5 h-4.5 inline-block mr-1" /> Transferir
  </Button>

  <Button
    onClick={() => setShowHistorico(true)}
    className="bg-red-600 hover:bg-red-700 text-white shadow w-full sm:w-auto"
  >
    <ReceiptText className="w-5 h-4.5 inline-block mr-1" /> Ver Extrato
  </Button>
</div>
</div>

  
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
  <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow">
    <SquarePlus className="w-5 h-4.5 inline-block mr-1" />  Adicionar Novo Ativo
  </Button>
<Button
  onClick={() => setShowAtualizarModal(true)}
  disabled={bloqueado}
  className="bg-green-600 hover:bg-green-700 text-white shadow"
>
  <Calculator className="w-5 h-4.5 inline-block mr-1" /> Atualizar Valores de Investimentos
</Button>

<Button
    onClick={async () => {
    const resumos: ResumoIR[] = await verificarImpostoMensal(
      historico,
      setValorVariavelDisponivel,
      setHistorico,
      login,
      false // apenas resumo
    );
    setResumosIR(resumos);
    setMostrarModalIR(true);
  }}
  className="bg-red-600 hover:bg-red-700 text-white shadow"
>
  🦁 Informar Imposto de Renda
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
                onInformarDividendo={
    ativo.tipo === 'rendaVariavel' && ativo.subtipo === 'fii'
      ? () => handleInformarDividendo(ativo as RendaVariavelAtivo)
      : undefined
  }
              />
            ))}
          </div>
<div className="mt-8 bg-white p-4 rounded-x1 shadow-lg border-2 border-gray-200 relative">
  {/* Cabeçalho do gráfico */}
<div className="flex flex-col items-center mb-4">
  <h2 className="text-xl font-semibold text-center mb-2">📈 Evolução do Patrimônio</h2>
  <select
    value={escalaY}
    onChange={(e) => {
      setEscalaY(e.target.value as 'linear' | 'logarithmic');
      localStorage.setItem('escalaY', e.target.value);
    }}
    className="bg-gray-600 text-white px-4 py-2 rounded-md font-semibold text-sm shadow"
  >
    <option value="linear">Escala Linear</option>
    <option value="logarithmic">Escala Logarítmica</option>
  </select>
</div>
            <div className="h-[500px] overflow-x-auto min-w-[600px] bg-white">



<Line
  ref={chartRef}
  data={{
    ...chartData,
    datasets: chartData.datasets.map((dataset) => ({
      ...dataset,
      tension: 0.3,
      pointRadius: 3,
    })),
  }}
    options={{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
                zoom: {
          pan: {
            enabled: true,
            mode: 'xy'
          },
          zoom: {
            wheel: {
              enabled: false,
            },
            pinch: {
              enabled: true
            },
            drag: {
              enabled: true,
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderColor: 'rgba(0,0,0,0.25)',
              borderWidth: 1,
              modifierKey: 'ctrl'
            },
            mode: 'xy'
          }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
          },
          onHover: (event) => {
            const target = event?.native?.target as HTMLElement | null;
            if (target) target.style.cursor = 'pointer';
          },
          onLeave: (event) => {
            const target = event?.native?.target as HTMLElement | null;
            if (target) target.style.cursor = 'default';
          },
          onClick: (e, legendItem, legend) => {
            const ci = legend.chart;
            const index = legendItem.datasetIndex;
            if (index !== undefined) {
              const meta = ci.getDatasetMeta(index);
              const alreadyHidden = meta.hidden === true || ci.data.datasets[index].hidden === true;
              meta.hidden = !alreadyHidden;
              ci.update();
            }
          },
        },
        tooltip: {
          mode: 'nearest',
          intersect: true,
          callbacks: {
            label: (context) => {
              const valorAtual = Number(context.raw);
              const dataset = context.dataset;
              const primeiroValor = dataset.data.find((v: any) => typeof v === 'number' && v > 0) as number;
              const variacao = primeiroValor ? (((valorAtual - primeiroValor) / primeiroValor) * 100).toFixed(2) : '0';
              return ` ${dataset.label}: ${formatCurrency(valorAtual)} (${variacao}%)`;
            }
          }
        },
        title: {
          display: true,
          text:  'Gráfico de acompanhamento da evolução da carteira de investimentos',
          font: {size: 20},
        },
      },
      scales: {
        x: {
  type: 'category',
  ticks: {
    autoSkip: true,
    maxTicksLimit: allDates.length,
            callback: function(_, index) {
              const rawDate = chartData.labels?.[index];
              if (!rawDate) return '';
              const [dia, mes, ano] = rawDate.split('/');
              return `${dia}/${mes}`;
            },
    maxRotation: 45,
    minRotation: 0
  }
},
        y: {
          type: escalaY,
          min: minY,
          max: maxY,
          ticks: {
            callback: (value) => formatCurrency(Number(value)),
          }
        }
      },
             interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: true
      }
    }} />
  </div>
<div className="mt-4 flex justify-center gap-4">
  <Button
    variant="secondary"
  onClick={() => {
    const canvas = document.querySelector('canvas');
    if (canvas && canvas instanceof HTMLCanvasElement) {
      const chart = Chart.getChart(canvas);
      chart?.resetZoom?.(); // chama a função resetZoom do plugin
    }
  }}
  >
    <RefreshCw className="w-4 h-4 mr-2 inline" /> Resetar Zoom
  </Button>

  <Button
    variant="primary"
    onClick={() => {
      const chartCanvas = document.querySelector('canvas');
      if (chartCanvas instanceof HTMLCanvasElement) {
        const link = document.createElement('a');
        const hoje = new Date();
        link.download = `grafico_patrimonio_${hoje.toLocaleDateString('pt-BR')}.png`;
        link.href = chartCanvas.toDataURL('image/png');
        link.click();
      }
    }}
  >
    <Download className="w-4 h-4 mr-2 inline" /> Baixar Gráfico
  </Button>
</div>
</div>
        </>
      ) : (
        <div className="text-center bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-x1">
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

      {mostrarModalIR && resumosIR && (
  <DeduzirIRModal
    resumosIR={resumosIR}
    onClose={() => setMostrarModalIR(false)}
    onConfirm={async (senhaDigitada: string) => {
      if (senhaDigitada !== senhaSalva) {
        alert('Senha incorreta.');
        return;
      }

      await verificarImpostoMensal(
        historico,
        setValorVariavelDisponivel,
        setHistorico,
        login,
        true // deduzir de fato
      );
      setMostrarModalIR(false);
    }}
  />
)}

 {showTransferencia && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <TransferenciaModal
      onClose={() => setShowTransferencia(false)}
      onConfirm={async (valor, direcao, senhaDigitada) => {
        if (senhaDigitada !== senhaSalva) {
          alert('Senha incorreta!');
          return;
        }

        if (valor <= 0) {
          alert('Digite um valor válido.');
          return;
        }

        const docRef = doc(db, 'usuarios', login);
        const dataAtual = new Date().toISOString();

        if (direcao === 'fixa-variavel') {
          if (valorFixaDisponivel < valor) {
            alert('Saldo insuficiente em Renda Fixa.');
            return;
          }
          setValorFixaDisponivel(prev => prev - valor);
          setValorVariavelDisponivel(prev => prev + valor);
          setDepositoFixa(prev => prev - valor);
          setDepositoVariavel(prev => prev + valor);
        } else {
          if (valorVariavelDisponivel < valor) {
            alert('Saldo insuficiente em Renda Variável.');
            return;
          }
          setValorVariavelDisponivel(prev => prev - valor);
          setValorFixaDisponivel(prev => prev + valor);
          setDepositoVariavel(prev => prev - valor);
          setDepositoFixa(prev => prev + valor);
        }

        const novoRegistro: RegistroHistorico = {
          tipo: 'transferencia',
          valor,
          data: dataAtual,
          destino: direcao === 'fixa-variavel' ? 'variavel' : 'fixa'
        };

        await updateDoc(docRef, {
          historico: arrayUnion(novoRegistro),
          depositoFixa: direcao === 'fixa-variavel' ? depositoFixa - valor : depositoFixa + valor,
          depositoVariavel: direcao === 'fixa-variavel' ? depositoVariavel + valor : depositoVariavel - valor
        });

        setHistorico(prev => [...prev, novoRegistro]);
        setShowTransferencia(false);
      }}
    />
  </div>
)
}

      {showHistorico && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <HistoricoModal
      historico={historico}
      onClose={() => setShowHistorico(false)}
    />
  </div>
)}
{showDividendoModal && ativoDividendo && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <InformarDividendoModal
      ativo={ativoDividendo}
      nome={ativoDividendo.nome}
      ticker={ativoDividendo.tickerFormatado}
      jaInformadoEsteMes={
        historico.some(h =>
          h.tipo === 'dividendo' &&
          h.nome === ativoDividendo.nome &&
          new Date(h.data).getMonth() === new Date().getMonth() &&
          new Date(h.data).getFullYear() === new Date().getFullYear()
        )
      }
      onClose={() => setShowDividendoModal(false)}
      onConfirm={confirmarDividendo}
    />
  </div>
)}

{showAtualizarModal && (
  <AtualizarInvestimentosModal
    onClose={() => setShowAtualizarModal(false)}
    onConfirm={async (senhaDigitada) => {
      if (senhaDigitada !== senhaSalva) {
        alert('Senha incorreta!');
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];
      const atualizados = await atualizarAtivos(ativos, hoje);

      setAtivos(atualizados);
await updateDoc(doc(db, 'usuarios', login), {
  ativos: atualizados,
  ultimaAtualizacao: hoje
});
await salvarUltimaAtualizacaoManual(login);

      setBloqueado(true);
      setTimeout(() => setBloqueado(false), 30 * 60 * 1000);

      setShowAtualizarModal(false);
    }}
  />
)}
    </div>
   );
}
