import { useEffect, useMemo, useState, useRef } from 'react';
import { db } from './firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Chart,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import AtivoCard from './components/AtivoCard';
import AddAtivoWizard from './components/AddAtivoWizard';
import VendaAtivoModal from './components/VendaAtivoModal';
import { Ativo, RendaVariavelAtivo, RendaFixaAtivo, AtivoComSenha } from './types/Ativo';
import Button from './components/Button';
import DepositarModal from './components/DepositarModal';
import TransferenciaModal from './components/TransferenciaModal';
import HistoricoModal from './components/HistoricoModal';
import InformarDividendoModal from './components/InformarDividendoModal';
import AtualizarInvestimentosModal from './components/AtualizarInvestimentosModal';
import useAtualizarAtivos from './hooks/useAtualizarAtivos';
import { atualizarAtivos } from './utils/atualizarAtivos';
import { obterUltimaAtualizacaoManual, salvarUltimaAtualizacaoManual } from './hooks/useAtualizarAtivos';
import FotoGrupoUploader from './components/FotoGrupoUploader';
import { CircleArrowUp, CircleArrowDown, Wallet, Receipt, ArrowRightLeft, ReceiptText, Calculator, SquarePlus, RefreshCw, Download } from 'lucide-react';
import { verificarImpostoMensal } from './hooks/verificarImpostoMensal';
import { ResumoIR } from './components/ResumoIR';
import DeduzirIRModal from './components/DeduzirIRModal';
import { calcularSaldoVariavel, calcularSaldoFixa } from './utils/ativoHelpers';
import { RegistroHistorico } from './hooks/RegistroHistorico';

Chart.register(zoomPlugin);
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

const formatCurrency = (value: number) => {
  if (Math.abs(value) < 1e-9) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function MainPage({ login, valorInvestido, fixo, variavel, nomeGrupo }: Omit<MainPageProps, 'senha'>) {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [error, setError] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [ativoSelecionado, setAtivoSelecionado] = useState<Ativo | null>(null);
  const [showVendaModal, setShowVendaModal] = useState(false);
  const [showDepositar, setShowDepositar] = useState(false);
  const [historico, setHistorico] = useState<RegistroHistorico[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const [senhaSalva, setSenhaSalva] = useState('');
  const [showDividendoModal, setShowDividendoModal] = useState(false);
  const [ativoDividendo, setAtivoDividendo] = useState<RendaVariavelAtivo | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [showAtualizarModal, setShowAtualizarModal] = useState(false);
  const [fotoGrupo, setFotoGrupo] = useState<string | null>(null);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [escalaY, setEscalaY] = useState<'linear' | 'logarithmic'>('linear');
  const [resumosIR, setResumosIR] = useState<ResumoIR[] | null>(null);
  const [mostrarModalIR, setMostrarModalIR] = useState(false);  

  // A função que faz a verificação e o upload.
  const handleUploadConfirmado = async (file: File, senhaDigitada: string) => {
    // 1. Verifica a senha
    if (senhaDigitada !== senhaSalva) {
      alert('Senha incorreta!');
      // Lança um erro para o componente filho saber que falhou.
      throw new Error("Senha incorreta");
    }

    // 2. Se a senha estiver correta, faz o upload.
    try {
      const storageRef = ref(storage, `fotosGrupos/${login}-${new Date().getTime()}.jpg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'usuarios', login), { fotoGrupo: url });
      setFotoGrupo(url); // Atualiza a UI imediatamente
    } catch (error) {
      alert('Erro ao enviar imagem.');
      console.error(error);
      throw error; // Re-lança o erro para o componente filho.
    }
  };

  const chartRef = useRef<Chart<'line'> | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'usuarios', login);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFotoGrupo(data?.fotoGrupo || null);
          setAtivos(data?.ativos || []);
          setHistorico((data?.historico || []) as RegistroHistorico[]);
          setSenhaSalva(data?.senha || '');
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    carregarDadosIniciais();
  }, [login]);

  useEffect(() => {
    const saldoFixaCalculado = calcularSaldoFixa(historico);
    const saldoVariavelCalculado = calcularSaldoVariavel(historico);
    setValorFixaDisponivel(saldoFixaCalculado);
    setValorVariavelDisponivel(saldoVariavelCalculado);
  }, [historico]);

  useAtualizarAtivos(ativos, (ativosAtualizados) => {
    setAtivos(ativosAtualizados);
  }, login);

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
    if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return; }
    if (!ativoDividendo) return;

    const hoje = new Date();
    const jaTemDividendoEsteMes = historico.some(
      (h) => h.tipo === 'dividendo' && h.nome === ativoDividendo.nome && new Date(h.data).getMonth() === hoje.getMonth() && new Date(h.data).getFullYear() === hoje.getFullYear()
    );
    if (jaTemDividendoEsteMes) { alert('Dividendo já registrado para este FII neste mês.'); return; }
    if (hoje.getDate() < 15) { alert('Os dividendos só podem ser informados após o dia 15 do mês.'); return; }

    const novoRegistro: RegistroHistorico = {
      tipo: 'dividendo',
      valor: valor * ativoDividendo.quantidade,
      nome: ativoDividendo.nome,
      data: hoje.toISOString()
    };
    await updateDoc(doc(db, 'usuarios', login), { historico: arrayUnion(novoRegistro) });
    setHistorico(prev => [...prev, novoRegistro]);

    setShowDividendoModal(false);
    setAtivoDividendo(null);
  };

  const handleDeposito = async (valor: number, destino: 'fixa' | 'variavel', senhaDigitada: string): Promise<boolean> => {
    if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return false; }
    const novoRegistro: RegistroHistorico = { tipo: 'deposito', valor, destino, data: new Date().toISOString() };
    await updateDoc(doc(db, 'usuarios', login), { historico: arrayUnion(novoRegistro) });
    setHistorico(prev => [...prev, novoRegistro]);
    return true;
  };

  const handleAddAtivo = async (novoAtivo: AtivoComSenha) => {
    if (novoAtivo.senha !== senhaSalva) { alert('Senha incorreta!'); return false; }
    const { senha: _, ...ativoSemSenha } = novoAtivo;

    try {
      let novosAtivos: Ativo[];
  
      if (ativoSemSenha.tipo === 'rendaVariavel') {
        const existente = ativos.find(a => a.tipo === 'rendaVariavel' && (a as RendaVariavelAtivo).tickerFormatado === (ativoSemSenha as RendaVariavelAtivo).tickerFormatado) as RendaVariavelAtivo | undefined;
        if (existente) {
          const novaQuantidade = existente.quantidade + (ativoSemSenha as RendaVariavelAtivo).quantidade;
          const novoInvestimento = existente.valorInvestido + ativoSemSenha.valorInvestido;
          const novoPrecoMedio = novoInvestimento / novaQuantidade;
          const atualizado: RendaVariavelAtivo = {
            ...existente,
            quantidade: novaQuantidade,
            valorInvestido: novoInvestimento,
            precoMedio: novoPrecoMedio,
            valorAtual: novoPrecoMedio,
            patrimonioPorDia: { ...existente.patrimonioPorDia, [new Date().toISOString().split('T')[0]]: novaQuantidade * novoPrecoMedio }
          };
          novosAtivos = ativos.map(a => a.id === existente.id ? atualizado : a);
        } else {
          novosAtivos = [...ativos, ativoSemSenha as Ativo]; // ✅ CORREÇÃO 1: Asserção de tipo
        }
      } else {
        novosAtivos = [...ativos, ativoSemSenha as Ativo]; // ✅ CORREÇÃO 1: Asserção de tipo
      }
      
      setAtivos(novosAtivos);

      const novoRegistro: RegistroHistorico = {
        tipo: 'compra',
        valor: ativoSemSenha.valorInvestido,
        nome: ativoSemSenha.nome,
        categoria: ativoSemSenha.tipo,
        subtipo: (ativoSemSenha as RendaVariavelAtivo).subtipo,
        data: new Date().toISOString()
      };
      
      await updateDoc(doc(db, 'usuarios', login), {
        ativos: novosAtivos,
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
    if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return; }
    if (!ativoSelecionado) return;
    
    const docRef = doc(db, 'usuarios', login);

    if (ativoSelecionado.tipo === 'rendaFixa') {
      const { calcularImpostoRenda } = await import('./hooks/calcularImpostoRenda');
      const resultadoIR = calcularImpostoRenda(ativoSelecionado.dataInvestimento, ativoSelecionado.valorInvestido, ativoSelecionado.valorAtual);

      const registroVenda: RegistroHistorico = {
        tipo: 'venda', valor: resultadoIR.valorLiquido, valorBruto: ativoSelecionado.valorAtual, valorLiquido: resultadoIR.valorLiquido,
        imposto: resultadoIR.imposto, diasAplicado: resultadoIR.diasAplicado, nome: ativoSelecionado.nome, categoria: 'rendaFixa', data: new Date().toISOString()
      };
      const ativosRestantes = ativos.filter(a => a.id !== ativoSelecionado.id);
      setAtivos(ativosRestantes);
      
      await updateDoc(docRef, { ativos: ativosRestantes, historico: arrayUnion(registroVenda) });
      setHistorico(prev => [...prev, registroVenda]);

    } else { // Renda Variável
      const valorVenda = quantidadeVendida * ativoSelecionado.valorAtual;
      const novoRegistroVenda: RegistroHistorico = {
        tipo: 'venda', valor: valorVenda, nome: ativoSelecionado.nome, categoria: 'rendaVariavel', subtipo: ativoSelecionado.subtipo, data: new Date().toISOString()
      };
      const novaQuantidade = ativoSelecionado.quantidade - quantidadeVendida;
      
      if (Math.abs(novaQuantidade) < 1e-8) {
        const ativosRestantes = ativos.filter(a => a.id !== ativoSelecionado.id);
        setAtivos(ativosRestantes);
        await updateDoc(docRef, { ativos: ativosRestantes, historico: arrayUnion(novoRegistroVenda) });
      } else {
        const ativosAtualizados = ativos.map(a => 
          (a.id === ativoSelecionado.id && a.tipo === 'rendaVariavel') ? { ...a, quantidade: novaQuantidade, valorInvestido: novaQuantidade * a.precoMedio } : a
        );
        setAtivos(ativosAtualizados);
        await updateDoc(docRef, { ativos: ativosAtualizados, historico: arrayUnion(novoRegistroVenda) });
      }
      setHistorico(prev => [...prev, novoRegistroVenda]);
    }
    setShowVendaModal(false);
    setAtivoSelecionado(null);
  };

  const coresAtivos = useMemo(() => {
    const mapeamento: Record<string, string> = {};
    ativos.forEach((ativo, index) => { mapeamento[ativo.id] = CORES_UNICAS[index % CORES_UNICAS.length]; });
    return mapeamento;
  }, [ativos]);
  const getCorAtivo = (ativoId: string) => coresAtivos[ativoId] || CORES_UNICAS[0];

  const allDates = useMemo(() => Array.from(new Set(ativos.flatMap(a => Object.keys(a.patrimonioPorDia)))).sort(), [ativos]);
  
  const chartData = useMemo(() => ({
    labels: allDates.map(date => {
      const [ano, mes, dia] = date.split('-');
      return `${dia}/${mes}/${ano}`;
    }),
    datasets: ativos.map(ativo => ({
      label: ativo.nome,
      data: allDates.map(date => ativo.patrimonioPorDia?.[date] ?? null),
      borderColor: getCorAtivo(ativo.id),
      backgroundColor: getCorAtivo(ativo.id) + '33',
      borderWidth: 3,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderDash: (ativo.tipo === 'rendaVariavel' && ativo.quantidade === 0) || (ativo.tipo === 'rendaFixa' && ativo.valorAtual === 0) ? [5, 5] : undefined
    }))
  }), [ativos, allDates, coresAtivos]);

  const { minY, maxY } = useMemo(() => {
    const todosValores = chartData.datasets.flatMap(ds => ds.data).filter((v): v is number => v !== null && v > 0);
    if (todosValores.length === 0) return { minY: 0, maxY: 100 };
    const menorValor = Math.min(...todosValores);
    const maiorValor = Math.max(...todosValores);
    return { minY: Math.max(menorValor * 0.5, 0.01), maxY: maiorValor * 1.2 };
  }, [chartData]);

  const totalAportado = useMemo(() => {
  // Esta é a forma mais robusta e simples:
  // Soma o valor de TODAS as transações do tipo 'deposito' encontradas no histórico.
  // Isso funciona porque o Login.tsx já registra o aporte inicial como 'deposito'.
  return historico
    .filter(registro => registro.tipo === 'deposito')
    .reduce((soma, deposito) => soma + deposito.valor, 0);
}, [historico]); // Roda sempre que o histórico for atualizado
  
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
  // Se não houve aportes, não há variação. Evita divisão por zero.
  if (totalAportado === 0) {
    return 0;
  }
  
  // O ganho real é a diferença entre o que a carteira vale agora
  // e tudo o que foi colocado nela.
  const ganhoReal = valorTotalAtual - totalAportado;
  
  // A rentabilidade é calculada sobre o total aportado.
  return (ganhoReal / totalAportado) * 100;
  
}, [valorTotalAtual, totalAportado]); // Agora depende do valor total e do total aportado

  return (
    <div className="p-4 max-w-6xl mx-auto">
{/* ===== INÍCIO DO NOVO CABEÇALHO ===== */}
<header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl shadow-2xl p-6 mb-8 w-full">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
    
    {/* Lado Esquerdo: Foto do Grupo */}
    <div className="flex-shrink-0">
      <FotoGrupoUploader 
        login={login} 
        fotoUrlAtual={fotoGrupo || undefined}
        onConfirmUpload={handleUploadConfirmado}
      />
    </div>

    {/* Centro: Título e Subtítulo */}
    <div className="text-center sm:text-left flex-grow">
      <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-md">
        {nomeGrupo}
      </h1>
      <p className="text-blue-200 text-sm md:text-base mt-1">
        Painel de Controle de Investimentos
      </p>
    </div>

    {/* Lado Direito (Opcional): Um resumo ou status */}
    <div className="hidden md:flex flex-col items-end bg-black bg-opacity-20 p-3 rounded-lg">
      <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">Patrimônio Total</p>
      <p className="text-2xl font-bold text-white">
        {formatCurrency(valorTotalAtual)}
      </p>
    </div>

  </div>
</header>
{/* ===== FIM DO NOVO CABEÇALHO ===== */}

      {error && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}
      {loading && <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-xl mb-4">Carregando...</div>}

      <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-lg mb-6 text-left min-h-[220px]">
        <h2 className="text-xl font-semibold mb-4">Saldo Disponível para Novos Investimentos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-sm w-full sm:w-auto">
            <span className="text-gray-700 text-xs font-semibold uppercase tracking-wide mb-1 block">Renda Fixa</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(valorFixaDisponivel)}</span>
          </div>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 shadow-sm w-full sm:w-auto">
            <span className="text-gray-700 text-xs font-semibold uppercase tracking-wide mb-1 block">Renda Variável / Criptomoedas</span>
            <span className="text-lg font-bold text-gray-800">{formatCurrency(valorVariavelDisponivel)}</span>
          </div>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 shadow-sm w-full sm:w-auto">
            <div className="flex items-center gap-1 text-blue-800 font-semibold uppercase tracking-wide text-xs mb-1">
              <Wallet className="w-5 h-4.5" /><span>Valor total da carteira</span>
            </div>
            <div className="text-gray-900 text-lg font-bold">{formatCurrency(valorTotalAtual)}</div>
            <div className={`text-sm font-semibold flex items-center ${variacaoPercentual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variacaoPercentual >= 0 ? <><CircleArrowUp className="w-4 h-4 mr-1" />{Math.abs(variacaoPercentual).toFixed(2)}%</> : <><CircleArrowDown className="w-4 h-4 mr-1" />{Math.abs(variacaoPercentual).toFixed(2)}%</>}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:container mx-auto mt-4">
          <Button onClick={() => setShowDepositar(true)} className="bg-blue-600 hover:bg-green-700 text-white shadow w-full sm:w-auto"><Receipt className="w-5 h-4.5 inline-block mr-1" /> Depositar</Button>
          <Button onClick={() => setShowTransferencia(true)} className="bg-purple-600 hover:bg-purple-700 text-white shadow w-full sm:w-auto"><ArrowRightLeft className="w-5 h-4.5 inline-block mr-1" /> Transferir</Button>
          <Button onClick={() => setShowHistorico(true)} className="bg-violet-600 hover:bg-violet-700 text-white shadow w-full sm:w-auto"><ReceiptText className="w-5 h-4.5 inline-block mr-1" /> Ver Extrato</Button>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <Button onClick={() => setShowWizard(true)} className="bg-blue-600 hover:bg-blue-700 text-white shadow"><SquarePlus className="w-5 h-4.5 inline-block mr-1" /> Adicionar Novo Ativo</Button>
        <Button onClick={() => setShowAtualizarModal(true)} disabled={bloqueado} className="bg-green-600 hover:bg-green-700 text-white shadow"><Calculator className="w-5 h-4.5 inline-block mr-1" /> Atualizar Valores de Investimentos</Button>
        <Button onClick={async () => {
          const resumos: ResumoIR[] = await verificarImpostoMensal(historico, setValorVariavelDisponivel, setHistorico, login, false);
          setResumosIR(resumos);
          setMostrarModalIR(true);
        }} className="bg-red-600 hover:bg-red-700 text-white shadow">🦁 Informar Imposto de Renda</Button>
      </div>

      {ativos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {ativos.map(ativo => (
              <AtivoCard key={ativo.id} ativo={ativo} onSell={handleSellAtivo} cor={getCorAtivo(ativo.id)} onInformarDividendo={ativo.tipo === 'rendaVariavel' && ativo.subtipo === 'fii' ? () => handleInformarDividendo(ativo as RendaVariavelAtivo) : undefined} />
            ))}
          </div>
          <div className="mt-8 bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200 relative">
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-xl font-semibold text-center mb-2">📈 Evolução do Patrimônio</h2>
              <select value={escalaY} onChange={(e) => { setEscalaY(e.target.value as 'linear' | 'logarithmic'); localStorage.setItem('escalaY', e.target.value); }} className="bg-gray-600 text-white px-4 py-2 rounded-md font-semibold text-sm shadow">
                <option value="linear">Escala Linear</option>
                <option value="logarithmic">Escala Logarítmica</option>
              </select>
            </div>
            <div className="h-[500px] overflow-x-auto min-w-[600px] bg-white">
              <Line ref={chartRef} data={{...chartData, datasets: chartData.datasets.map(ds => ({ ...ds, tension: 0.3, pointRadius: 3 }))}} options={{
                responsive: true, maintainAspectRatio: false,devicePixelRatio: window.devicePixelRatio,
                plugins: {
                  zoom: { pan: { enabled: true, mode: 'xy' }, zoom: { wheel: { enabled: false }, pinch: { enabled: true }, drag: { enabled: true, backgroundColor: 'rgba(0,0,0,0.1)', borderColor: 'rgba(0,0,0,0.25)', borderWidth: 1, modifierKey: 'ctrl' }, mode: 'xy' }},
                  legend: { display: true, position: 'top', labels: { boxWidth: 10, boxHeight: 10, padding: 15, usePointStyle: true, pointStyle: 'circle' },
                    onHover: (event) => { const target = event?.native?.target as HTMLElement | null; if (target) target.style.cursor = 'pointer'; },
                    onLeave: (event) => { const target = event?.native?.target as HTMLElement | null; if (target) target.style.cursor = 'default'; },
                    onClick: (e, legendItem, legend) => {
                      const ci = legend.chart;
                      const index = legendItem.datasetIndex;
                      if (index !== undefined) {
                        const meta = ci.getDatasetMeta(index);
                        meta.hidden = !meta.hidden;
                        ci.update();
                      }
                    }
                  },
                  tooltip: { mode: 'nearest', intersect: true, callbacks: { label: (ctx) => { const val = Number(ctx.raw); const ds = ctx.dataset; const firstVal = ds.data.find(v => typeof v === 'number' && v > 0) as number; const variation = firstVal ? (((val - firstVal) / firstVal) * 100).toFixed(2) : '0'; return ` ${ds.label}: ${formatCurrency(val)} (${variation}%)`; } } },
                  title: { display: true, text: 'Gráfico de acompanhamento da evolução da carteira de investimentos', font: { size: 20 } },
                },
                scales: {
                  x: { type: 'category', ticks: { autoSkip: true, maxTicksLimit: 20, callback: function(_, index) { const rawDate = chartData.labels?.[index]; if (!rawDate) return ''; const [dia, mes] = rawDate.split('/'); return `${dia}/${mes}`; }, maxRotation: 45, minRotation: 0 } },
                  y: { type: escalaY, min: minY, max: maxY, ticks: { callback: (value) => formatCurrency(Number(value)) } }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
              }} />
            </div>
            <div className="mt-4 flex justify-center gap-4">
              <Button variant="secondary" onClick={() => chartRef.current?.resetZoom()}><RefreshCw className="w-4 h-4 mr-2 inline" /> Resetar Zoom</Button>
              <Button variant="primary" onClick={() => { const canvas = chartRef.current?.canvas; if (canvas) { const link = document.createElement('a'); link.download = `grafico_patrimonio_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.png`; link.href = canvas.toDataURL('image/png'); link.click(); } }}><Download className="w-4 h-4 mr-2 inline" /> Baixar Gráfico</Button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl">Nenhum ativo cadastrado. Adicione seu primeiro ativo para começar.</div>
      )}

      {showWizard && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><AddAtivoWizard onClose={() => setShowWizard(false)} onAddAtivo={handleAddAtivo} valorFixaDisponivel={valorFixaDisponivel} valorVariavelDisponivel={valorVariavelDisponivel} quantidadeAtivos={ativos.length} /></div>}
      
      {showVendaModal && ativoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <VendaAtivoModal ativo={ativoSelecionado} onClose={() => setShowVendaModal(false)} onConfirm={confirmarVenda} />
        </div>
      )}

      {showDepositar && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><DepositarModal onClose={() => setShowDepositar(false)} onConfirm={handleDeposito} /></div>}
      {mostrarModalIR && resumosIR && <DeduzirIRModal resumosIR={resumosIR} onClose={() => setMostrarModalIR(false)} onConfirm={async (senha) => { if (senha !== senhaSalva) { alert('Senha incorreta.'); return; } await verificarImpostoMensal(historico, setValorVariavelDisponivel, setHistorico, login, true); setMostrarModalIR(false); }} />}
      
      {showTransferencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <TransferenciaModal onClose={() => setShowTransferencia(false)} onConfirm={async (valor, direcao, senhaDigitada) => {
            if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return; }
            if (valor <= 0) { alert('Digite um valor válido.'); return; }

            if (direcao === 'fixa-variavel' && valor > valorFixaDisponivel) { alert('Saldo insuficiente em Renda Fixa.'); return; }
            if (direcao === 'variavel-fixa' && valor > valorVariavelDisponivel) { alert('Saldo insuficiente em Renda Variável.'); return; }

            const novoRegistro: RegistroHistorico = {
              tipo: 'transferencia', valor, data: new Date().toISOString(), destino: direcao === 'fixa-variavel' ? 'variavel' : 'fixa'
            };
            await updateDoc(doc(db, 'usuarios', login), { historico: arrayUnion(novoRegistro) });
            setHistorico(prev => [...prev, novoRegistro]);
            setShowTransferencia(false);
          }} />
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

      {showDividendoModal && ativoDividendo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <InformarDividendoModal
            ativo={ativoDividendo}
            nome={ativoDividendo.nome}
            ticker={ativoDividendo.tickerFormatado}
            jaInformadoEsteMes={historico.some(
              (h) =>
                h.tipo === 'dividendo' &&
                h.nome === ativoDividendo.nome &&
                new Date(h.data).getMonth() === new Date().getMonth() &&
                new Date(h.data).getFullYear() === new Date().getFullYear()
            )}
            onClose={() => setShowDividendoModal(false)}
            onConfirm={confirmarDividendo}
          />
        </div>
      )}

      {showAtualizarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AtualizarInvestimentosModal
            onClose={() => setShowAtualizarModal(false)}
            onConfirm={async (senha) => {
              if (senha !== senhaSalva) {
                alert('Senha incorreta!');
                return;
              }
              const hoje = new Date().toISOString().split('T')[0];
              const atualizados = await atualizarAtivos(ativos, hoje);
              setAtivos(atualizados);
              await updateDoc(doc(db, 'usuarios', login), {
                ativos: atualizados,
                ultimaAtualizacao: hoje,
              });
              await salvarUltimaAtualizacaoManual(login);
              setBloqueado(true);
              setTimeout(() => setBloqueado(false), 30 * 60 * 1000);
              setShowAtualizarModal(false);
            }}
          />
        </div>
      )}
    </div>
  );
}