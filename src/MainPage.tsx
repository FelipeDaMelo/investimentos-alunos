import React, { useEffect, useMemo, useState, useRef } from 'react';
import { db } from './firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteDoc, runTransaction, query, collection, orderBy, getDocs } from 'firebase/firestore';
import { deleteObject } from 'firebase/storage';
import { mesEncerrado } from './utils/mesEncerrado';
import { motion } from 'framer-motion';
import { getAuth } from "firebase/auth";
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
import InformarDividendoModal from './components/InformarDividendosPendentesModal';
import AtualizarInvestimentosModal from './components/AtualizarInvestimentosModal';
import useAtualizarAtivos from './hooks/useAtualizarAtivos';
import { atualizarAtivos } from './utils/atualizarAtivos';
import { obterUltimaAtualizacaoManual, salvarUltimaAtualizacaoManual } from './hooks/useAtualizarAtivos';
import FotoGrupoUploader from './components/FotoGrupoUploader';
import { CircleArrowUp, CircleArrowDown, Wallet, Receipt, ArrowRightLeft, ReceiptText, Calculator, SquarePlus, RefreshCw, Download, LogOut, Trophy, TrendingUp, TrendingDown, ChevronRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom'; // ✅ 1. Importe o Link
import { verificarImpostoMensal } from './hooks/verificarImpostoMensal';
import { ResumoIR } from './components/ResumoIR';
import DeduzirIRModal from './components/DeduzirIRModal';
import { calcularSaldoVariavel, calcularSaldoFixa } from './utils/ativoHelpers';
import { RegistroHistorico } from './hooks/RegistroHistorico';
import ExcluirGrupoModal from './components/ExcluirGrupoModal';
import { verificarDividendosPendentes } from './utils/verificarDividendos';
import Header from './components/Header';
import SummaryCards from './components/SummaryCards';
import Sidebar from './components/Sidebar';
import AllocationCharts from './components/AllocationCharts';
import InformarDividendosPendentesModal, { PendenciaDividendo, DividendoPreenchido } from './components/InformarDividendosPendentesModal';
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

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
  fotoGrupo: string | null;
  setFotoGrupo: (url: string | null) => void;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) < 1e-9) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function MainPage({
  login,
  valorInvestido,
  fixo,
  variavel,
  nomeGrupo,
  fotoGrupo,
  setFotoGrupo,
  onLogout,
  onUploadConfirmado
}: Omit<MainPageProps, 'senha'>) {
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
  const [ativoDividendo, setAtivoDividendo] = useState<RendaVariavelAtivo | null>(null);
  const [pendenciasDividendo, setPendenciasDividendo] = useState<PendenciaDividendo[]>([]);
  const [showDividendosPendentesModal, setShowDividendosPendentesModal] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [showAtualizarModal, setShowAtualizarModal] = useState(false);
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [escalaY, setEscalaY] = useState<'linear' | 'logarithmic'>('linear');
  const [resumosIR, setResumosIR] = useState<ResumoIR[] | null>(null);
  const [mostrarModalIR, setMostrarModalIR] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [totalCotas, setTotalCotas] = useState(0);
  const [valorCotaAtual, setValorCotaAtual] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [valorTotalOntem, setValorTotalOntem] = useState(0);
  const [meusRankings, setMeusRankings] = useState<{ nome: string, rank: number, total: number, id: string }[]>([]);
  const [rankingData, setRankingData] = useState<{ nome: string, pontos: number, patrimonio?: number, foto?: string, rank?: number }[]>([]);

  const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setShowWizard(false);
    setShowVendaModal(false);
    setShowDepositar(false);
    setMostrarModalIR(false);
    setShowDeleteModal(false);
    setShowTransferencia(false);
    setShowHistorico(false);
    setShowDividendosPendentesModal(false);
    setShowAtualizarModal(false);
    setter(true);
  };

  const chartRef = useRef<Chart<'line'> | null>(null);

  const isAnyModalOpen = showWizard || showVendaModal || showDepositar || showHistorico ||
    showDividendosPendentesModal || showAtualizarModal ||
    showTransferencia || mostrarModalIR || showDeleteModal;

  const getActiveModal = () => {
    if (showWizard) return 'wizard';
    if (showDepositar) return 'depositar';
    if (showTransferencia) return 'transferir';
    if (showHistorico) return 'historico';
    if (mostrarModalIR) return 'ir';
    if (showAtualizarModal) return 'atualizar';
    if (showDeleteModal) return 'delete';
    return null;
  };

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto'; // Or '' to remove the inline style
    }

    return () => {
      document.body.style.overflow = 'auto'; // Reset on unmount
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'usuarios', login);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // setFotoGrupo(data?.fotoGrupo || null); // Removido: agora vem via props
          setAtivos(data?.ativos || []);
          setHistorico((data?.historico || []) as RegistroHistorico[]);
          setSenhaSalva(data?.senha || '');
          setTotalCotas(data?.totalCotas || 0);
          if (data?.valorCotaPorDia) {
            const datasOrdenadas = Object.keys(data.valorCotaPorDia).sort();
            const ultimaData = datasOrdenadas[datasOrdenadas.length - 1];
            setValorCotaAtual(data.valorCotaPorDia[ultimaData] || 1);
          }
          if (data?.patrimonioPorDia) {
            const datasOrdenadas = Object.keys(data.patrimonioPorDia).sort();
            // Se hoje já foi salvo, pegamos a penúltima. Se não, pegamos a última.
            const hoje = new Date().toISOString().split('T')[0];
            const ultimaData = datasOrdenadas[datasOrdenadas.length - 1];
            if (ultimaData === hoje && datasOrdenadas.length > 1) {
              const penultimaData = datasOrdenadas[datasOrdenadas.length - 2];
              setValorTotalOntem(data.patrimonioPorDia[penultimaData] || 0);
            } else {
              setValorTotalOntem(data.patrimonioPorDia[ultimaData] || 0);
            }
          }
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    carregarDadosIniciais();

    const fetchMiniRanking = async () => {
      try {
        // 1. Busca todos os rankings
        const rankingsQuery = query(collection(db, "rankings"));
        const rankingsSnapshot = await getDocs(rankingsQuery);

        const rankingsParticipando: any[] = [];
        rankingsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.participantes && data.participantes.includes(login)) {
            rankingsParticipando.push({ id: doc.id, ...data });
          }
        });

        // 2. Para cada ranking que participo, calcula minha posição
        const resumosRankings: any[] = [];
        const usersSnapshot = await getDocs(collection(db, "usuarios"));
        const allUsersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        for (const r of rankingsParticipando) {
          const participantes = allUsersData.filter(u => r.participantes.includes(u.id));
          participantes.sort((a: any, b: any) => (b.rentabilidade || 0) - (a.rentabilidade || 0));
          const myIdx = participantes.findIndex(u => u.id === login);
          if (myIdx !== -1) {
            resumosRankings.push({
              id: r.id,
              nome: r.nome,
              rank: myIdx + 1,
              total: participantes.length
            });
          }
        }
        setMeusRankings(resumosRankings);

        // 3. Leaderboard padrão (do primeiro ranking ou global)
        let leaderboardData: any[] = [];
        if (rankingsParticipando.length > 0) {
          const r = rankingsParticipando[0];
          const participantesMapped = allUsersData
            .filter(u => r.participantes.includes(u.id))
            .map((u: any) => ({
              nome: u.id,
              pontos: u.rentabilidade || 0,
              patrimonio: u.patrimonioTotal || 0,
              foto: u.fotoGrupo
            }));
          participantesMapped.sort((a: any, b: any) => b.pontos - a.pontos);

          const top5 = participantesMapped.slice(0, 5);
          const userIdx = participantesMapped.findIndex(u => u.nome === login);
          if (userIdx !== -1 && userIdx >= 5) {
            leaderboardData = [...top5, { ...participantesMapped[userIdx], rank: userIdx + 1 }];
          } else {
            leaderboardData = top5.map((u, i) => ({ ...u, rank: i + 1 }));
          }
        } else {
          // Fallback global
          const global = [...allUsersData].sort((a: any, b: any) => (b.rentabilidade || 0) - (a.rentabilidade || 0));
          leaderboardData = global.slice(0, 5).map((u: any, i) => ({
            nome: u.id,
            pontos: u.rentabilidade || 0,
            patrimonio: u.patrimonioTotal || 0,
            foto: u.fotoGrupo,
            rank: i + 1
          }));
        }
        setRankingData(leaderboardData);

      } catch (err) {
        console.error("Erro ao carregar mini-ranking:", err);
      }
    };
    fetchMiniRanking();
  }, [login]);

  useEffect(() => {
    const saldoFixaCalculado = calcularSaldoFixa(historico);
    const saldoVariavelCalculado = calcularSaldoVariavel(historico);
    setValorFixaDisponivel(saldoFixaCalculado);
    setValorVariavelDisponivel(saldoVariavelCalculado);
  }, [historico]);

  // Lógica para capturar ações vindo de outras páginas via Sidebar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');

    if (action) {
      if (action === 'wizard') openModal(setShowWizard);
      if (action === 'depositar') openModal(setShowDepositar);
      if (action === 'transferir') openModal(setShowTransferencia);
      if (action === 'historico') openModal(setShowHistorico);
      if (action === 'atualizar') openModal(setShowAtualizarModal);
      if (action === 'ir') {
        const triggerIR = async () => {
          const resumos = await verificarImpostoMensal(historico);
          setResumosIR(resumos);
          openModal(setMostrarModalIR);
        };
        triggerIR();
      }

      // Limpa o parâmetro da URL para não reabrir ao atualizar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
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
        if (diff < 1) {
          setBloqueado(true);
          setTimeout(() => setBloqueado(false), (1 - diff) * 60000);
        }
      }
    }
    verificarBloqueio();
  }, [login]);


  // ADICIONE estas duas novas funções no lugar das antigas

  // 1. Função para VERIFICAR as pendências e ABRIR o modal
  const handleVerificarDividendos = (ativoFII: RendaVariavelAtivo) => {
    const pendencias = verificarDividendosPendentes(ativoFII, historico);
    setAtivoDividendo(ativoFII); // Guarda o FII para usarmos o nome e ticker no modal
    setPendenciasDividendo(pendencias);
    openModal(setShowDividendosPendentesModal);
  };

  // 2. Função para CONFIRMAR e salvar os dividendos informados no modal
  const handleConfirmarDividendos = async (
    dividendos: DividendoPreenchido[],
    senhaDigitada: string
  ) => {
    if (senhaDigitada !== senhaSalva) {
      alert('Senha incorreta!');
      return;
    }
    if (!ativoDividendo) return;

    setLoading(true);
    try {
      const novosRegistros: RegistroHistorico[] = [];
      const docRef = doc(db, 'usuarios', login);

      for (const dividendo of dividendos) {
        const pendenciaOriginal = pendenciasDividendo.find(p => p.mesApuracao === dividendo.mesApuracao);
        if (!pendenciaOriginal) continue;

        const valorTotal = dividendo.valorPorCota * pendenciaOriginal.quantidadeNaqueleMes;

        const novoRegistro: RegistroHistorico = {
          tipo: 'dividendo',
          valor: valorTotal,
          nome: ativoDividendo.nome,
          data: new Date().toISOString(),
          mesApuracao: dividendo.mesApuracao,
        };

        novosRegistros.push(novoRegistro);
        await updateDoc(docRef, { historico: arrayUnion(novoRegistro) });
      }

      setHistorico(prev => [...prev, ...novosRegistros]);
      setShowDividendosPendentesModal(false);
      alert('Dividendos registrados com sucesso!');

    } catch (error) {
      console.error("Erro ao registrar dividendos:", error);
      alert("Ocorreu um erro ao registrar os dividendos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposito = async (valor: number, destino: 'fixa' | 'variavel', senhaDigitada: string): Promise<boolean> => {
    if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return false; }

    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'usuarios', login);
        const userDoc = await transaction.get(docRef);

        if (!userDoc.exists()) throw new Error("Documento não encontrado");

        const data = userDoc.data();
        const totalCotasLocal = data.totalCotas || 0;
        const valorCotaAtualLocal = valorCotaAtual; // Usamos o estado local para o valor da cota, ou poderíamos recalcular.

        const novasCotas = valor / valorCotaAtualLocal;
        const novoTotalCotas = totalCotasLocal + novasCotas;

        const novoRegistro: RegistroHistorico = {
          tipo: 'deposito',
          valor,
          destino,
          data: new Date().toISOString()
        };

        transaction.update(docRef, {
          historico: arrayUnion(novoRegistro),
          totalCotas: novoTotalCotas
        });

        // Atualizamos o estado local após o sucesso da transação
        setTotalCotas(novoTotalCotas);
        setHistorico(prev => [...prev, novoRegistro]);
      });
      return true;
    } catch (e) {
      console.error("Erro no depósito:", e);
      return false;
    }
  };

  const handleAddAtivo = async (novoAtivo: AtivoComSenha, comentario: string) => {
    if (novoAtivo.senha !== senhaSalva) {
      alert('Senha incorreta!');
      return false;
    }
    const { senha: _, ...ativoSemSenha } = novoAtivo;

    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'usuarios', login);
        const userDoc = await transaction.get(docRef);
        if (!userDoc.exists()) throw new Error("Usuário não encontrado");

        const data = userDoc.data();
        const ativosAtuais = (data.ativos || []) as Ativo[];
        let novosAtivos: Ativo[];

        if (ativoSemSenha.tipo === 'rendaVariavel') {
          const ativoVariavelNovo = ativoSemSenha as RendaVariavelAtivo;
          const existente = ativosAtuais.find(a => a.tipo === 'rendaVariavel' && (a as RendaVariavelAtivo).tickerFormatado === ativoVariavelNovo.tickerFormatado) as RendaVariavelAtivo | undefined;

          if (existente) {
            const novaQuantidade = existente.quantidade + ativoVariavelNovo.quantidade;
            const novoInvestimento = existente.valorInvestido + ativoVariavelNovo.valorInvestido;
            const novoPrecoMedio = novoInvestimento / novaQuantidade;
            const precoDeMercadoAtual = ativoVariavelNovo.valorAtual;

            const atualizado: RendaVariavelAtivo = {
              ...existente,
              quantidade: novaQuantidade,
              valorInvestido: novoInvestimento,
              precoMedio: novoPrecoMedio,
              valorAtual: precoDeMercadoAtual,
              patrimonioPorDia: {
                ...existente.patrimonioPorDia,
                [new Date().toISOString().split('T')[0]]: novaQuantidade * precoDeMercadoAtual
              }
            };
            novosAtivos = ativosAtuais.map(a => a.id === existente.id ? atualizado : a);
          } else {
            novosAtivos = [...ativosAtuais, ativoSemSenha as Ativo];
          }
        } else {
          novosAtivos = [...ativosAtuais, ativoSemSenha as Ativo];
        }

        const novoRegistro: RegistroHistorico = {
          tipo: 'compra',
          valor: ativoSemSenha.valorInvestido,
          nome: ativoSemSenha.nome,
          categoria: ativoSemSenha.tipo,
          data: new Date().toISOString(),
          comentario: comentario,
        };

        if (ativoSemSenha.tipo === 'rendaVariavel') {
          const ativoVariavel = ativoSemSenha as RendaVariavelAtivo;
          novoRegistro.subtipo = ativoVariavel.subtipo;
          novoRegistro.quantidade = ativoVariavel.quantidade;
        }

        transaction.update(docRef, {
          ativos: novosAtivos,
          historico: arrayUnion(novoRegistro)
        });

        // Atualiza estado local após sucesso
        setAtivos(novosAtivos);
        setHistorico(prev => [...prev, novoRegistro]);
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
    openModal(setShowVendaModal);
  };

  const confirmarVenda = async (quantidadeVendida: number, senhaDigitada: string, comentario: string) => {
    if (isSubmitting) return;
    if (senhaDigitada !== senhaSalva) { alert('Senha incorreta!'); return; }
    if (!ativoSelecionado) return;

    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const docRef = doc(db, 'usuarios', login);
        const userDoc = await transaction.get(docRef);
        if (!userDoc.exists()) throw new Error("Usuário não encontrado");

        const data = userDoc.data();
        const ativosAtuais = (data.ativos || []) as Ativo[];

        // Localiza o ativo real no banco (pode ter mudado desde que abrimos o modal)
        const ativoNoBanco = ativosAtuais.find(a => a.id === ativoSelecionado.id);
        if (!ativoNoBanco) throw new Error("Ativo não encontrado no banco de dados.");

        let novosAtivos: Ativo[];
        let registroVenda: RegistroHistorico;

        if (ativoNoBanco.tipo === 'rendaFixa') {
          const valorSolicitado = quantidadeVendida; // Amount requested in VendaAtivoModal (R$)
          const proporcao = valorSolicitado / ativoNoBanco.valorAtual;
          const valorInvestidoProporcional = ativoNoBanco.valorInvestido * proporcao;

          const { calcularImpostoRenda } = await import('./hooks/calcularImpostoRenda');
          const resultadoIR = calcularImpostoRenda(ativoNoBanco.dataInvestimento, valorInvestidoProporcional, valorSolicitado);

          registroVenda = {
            tipo: 'venda', valor: resultadoIR.valorLiquido, valorBruto: valorSolicitado, valorLiquido: resultadoIR.valorLiquido,
            imposto: resultadoIR.imposto, diasAplicado: resultadoIR.diasAplicado, nome: ativoNoBanco.nome, categoria: 'rendaFixa', data: new Date().toISOString(), comentario: comentario,
          };

          if (proporcao >= 0.999999) {
            novosAtivos = ativosAtuais.filter(a => a.id !== ativoNoBanco.id);
          } else {
            const restoValorInvestido = ativoNoBanco.valorInvestido - valorInvestidoProporcional;
            const restoValorAtual = ativoNoBanco.valorAtual - valorSolicitado;
            const hoje = new Date().toISOString().split('T')[0];
            const patrimonioAtualizado = { ...ativoNoBanco.patrimonioPorDia, [hoje]: restoValorAtual };

            novosAtivos = ativosAtuais.map(a => 
              a.id === ativoNoBanco.id 
                ? { ...a, valorInvestido: restoValorInvestido, valorAtual: restoValorAtual, patrimonioPorDia: patrimonioAtualizado } 
                : a
            );
          }

        } else { // Renda Variável
          const ativoRV = ativoNoBanco as RendaVariavelAtivo;
          if (quantidadeVendida > ativoRV.quantidade) throw new Error("Quantidade insuficiente.");

          const valorVenda = quantidadeVendida * ativoRV.valorAtual;
          registroVenda = {
            tipo: 'venda', valor: valorVenda, nome: ativoRV.nome, categoria: 'rendaVariavel', subtipo: ativoRV.subtipo, quantidade: quantidadeVendida, data: new Date().toISOString(), comentario: comentario,
          };

          const novaQuantidade = ativoRV.quantidade - quantidadeVendida;

          if (Math.abs(novaQuantidade) < 1e-8) {
            novosAtivos = ativosAtuais.filter(a => a.id !== ativoRV.id);
          } else {
            novosAtivos = ativosAtuais.map(a =>
              (a.id === ativoRV.id)
                ? {
                  ...a,
                  quantidade: novaQuantidade,
                  valorInvestido: novaQuantidade * (a as RendaVariavelAtivo).precoMedio
                }
                : a
            );
          }
        }

        transaction.update(docRef, {
          ativos: novosAtivos,
          historico: arrayUnion(registroVenda)
        });

        // Atualiza estado local após sucesso
        setAtivos(novosAtivos);
        setHistorico(prev => [...prev, registroVenda]);
      });
    } catch (error: any) {
      console.error("Erro ao confirmar a venda:", error);
      alert(error.message || "Ocorreu um erro ao processar a venda.");
    } finally {
      setShowVendaModal(false);
      setAtivoSelecionado(null);
      setIsSubmitting(false);
    }
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
      let valorDoAtivo = 0;

      if (ativo.tipo === 'rendaVariavel') {
        const ativoRV = ativo as RendaVariavelAtivo;
        valorDoAtivo = ativoRV.patrimonioPorDia?.[dataHoje] ?? ativoRV.valorAtual * ativoRV.quantidade;
      } else { // Renda Fixa
        valorDoAtivo = ativo.patrimonioPorDia?.[dataHoje] ?? ativo.valorAtual;
      }

      // ✅ A CORREÇÃO ESTÁ AQUI: Arredonda o valor de CADA ativo antes de somar ao total
      return total + parseFloat(valorDoAtivo.toFixed(2));

    }, 0);

    // O resto da soma continua igual
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


  useEffect(() => {
    // Só executa se tivermos os dados necessários para o cálculo
    if (valorTotalAtual > 0 && totalCotas > 0 && !loading && login) {
      // 1. Calcula o novo valor da cota
      const novoValorCota = valorTotalAtual / totalCotas;

      // 2. Arredonda os valores para salvar no DB
      const valorPatrimonioArredondado = parseFloat(valorTotalAtual.toFixed(2));
      const valorCotaArredondado = parseFloat(novoValorCota.toFixed(6)); // Cotas precisam de mais precisão

      // 3. Atualiza o estado local para a UI refletir a mudança imediatamente
      setValorCotaAtual(valorCotaArredondado);

      // 4. Salva ambos os dados no Firestore
      const hoje = new Date().toISOString().split('T')[0];
      const docRef = doc(db, 'usuarios', login);

      updateDoc(docRef, {
        [`patrimonioPorDia.${hoje}`]: valorPatrimonioArredondado,
        [`valorCotaPorDia.${hoje}`]: valorCotaArredondado,
        rentabilidade: variacaoPercentual, // Salva para o ranking global
        patrimonioTotal: valorPatrimonioArredondado // Salva para o ranking global
      }).catch(err => {
        console.error("Erro ao salvar dados diários de patrimônio e cota:", err);
      });
    }
  }, [valorTotalAtual, totalCotas, login, loading, variacaoPercentual]); // Added variacaoPercentual to dependencies


  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        login={login}
        fotoGrupo={fotoGrupo}
        onLogout={onLogout}
        onUploadConfirmado={onUploadConfirmado}
        onTriggerDelete={() => openModal(setShowDeleteModal)}
        onShowWizard={() => openModal(setShowWizard)}
        onShowDepositar={() => openModal(setShowDepositar)}
        onShowTransferencia={() => openModal(setShowTransferencia)}
        onShowHistorico={() => openModal(setShowHistorico)}
        onShowAtualizar={() => openModal(setShowAtualizarModal)}
        onVerificarIR={async () => {
          const resumos: ResumoIR[] = await verificarImpostoMensal(historico);
          setResumosIR(resumos);
          openModal(setMostrarModalIR);
        }}
        bloqueadoAtualizar={bloqueado}
        activeModal={getActiveModal()}
      />

      <div className="flex-1 flex flex-col w-full bg-gray-50/50 transition-all duration-500 relative">
        <div className={`flex-1 flex flex-col p-4 pb-28 md:p-10 md:pb-10 ${isAnyModalOpen ? 'overflow-hidden' : 'overflow-y-auto'} custom-scrollbar`}>
          <Header
            login={login}
            nomeGrupo={nomeGrupo}
            fotoGrupo={fotoGrupo}
            onLogout={onLogout}
            onUploadConfirmado={onUploadConfirmado}
            onTriggerDelete={() => openModal(setShowDeleteModal)}
            valorTotalAtual={valorTotalAtual}
            formatCurrency={formatCurrency}
          />

          {error && <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">{error}</div>}
          {loading && <div className="bg-blue-100 border-2 border-blue-400 text-blue-700 px-4 py-3 rounded-xl mb-4">Carregando...</div>}

          <SummaryCards
            valorFixaDisponivel={valorFixaDisponivel}
            valorVariavelDisponivel={valorVariavelDisponivel}
            valorTotalAtual={valorTotalAtual}
            variacaoPercentual={variacaoPercentual}
            formatCurrency={formatCurrency}
          />

          {ativos.length > 0 ? (
            <>
              {/* Dashboard Hub: Gráfico + Mini Ranking */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10 w-full animate-fade-in delay-150">

                {/* Gráfico (2/3 no Desktop) */}
                <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Evolução do Patrimônio</h2>
                    <div className="flex items-center gap-2">
                      <select
                        value={escalaY}
                        onChange={(e) => setEscalaY(e.target.value as any)}
                        className="bg-slate-50 border-none text-slate-600 text-sm font-bold px-4 py-2 rounded-xl focus:ring-0 cursor-pointer"
                      >
                        <option value="linear">Escala Linear</option>
                        <option value="logarithmic">Escala Logarítmica</option>
                      </select>
                    </div>
                  </div>

                  <div className="h-[350px] w-full">
                    <Line
                      ref={chartRef}
                      data={{
                        ...chartData,
                        datasets: chartData.datasets.map(ds => ({
                          ...ds,
                          tension: 0.4,
                          pointRadius: 2,
                          borderWidth: 3,
                          fill: true,
                          backgroundColor: 'rgba(59, 130, 246, 0.05)'
                        }))
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            align: 'center',
                            labels: {
                              usePointStyle: true,
                              pointStyle: 'circle',
                              padding: 20,
                              color: '#64748b',
                              font: { size: 12, weight: 'bold' }
                            }
                          },
                          zoom: {
                            zoom: {
                              wheel: { enabled: true },
                              pinch: { enabled: true },
                              drag: {
                                enabled: true,
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderColor: 'rgba(59, 130, 246, 0.4)',
                                borderWidth: 1
                              },
                              mode: 'x',
                            },
                            pan: {
                              enabled: true,
                              mode: 'x',
                            }
                          },
                          tooltip: {
                            backgroundColor: '#1e293b',
                            padding: 12,
                            cornerRadius: 12,
                            callbacks: {
                              label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(Number(ctx.raw))}`
                            }
                          }
                        },
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                          x: {
                            type: 'category',
                            grid: { color: '#f1f5f9' },
                            border: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 } },
                            title: { display: true, text: 'Período', color: '#64748b', font: { size: 10, weight: 'bold' } }
                          },
                          y: {
                            type: escalaY,
                            grid: { color: '#f1f5f9' },
                            border: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => formatCurrency(Number(v)) },
                            title: { display: true, text: 'Valor (R$)', color: '#64748b', font: { size: 10, weight: 'bold' } }
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="mt-6 flex justify-center gap-4 p-2">
                    <button
                      onClick={() => chartRef.current?.resetZoom()}
                      className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <RefreshCw size={16} /> Resetar Zoom
                    </button>
                    <button
                      onClick={() => {
                        const canvas = chartRef.current?.canvas;
                        if (canvas) {
                          const link = document.createElement('a');
                          link.download = `evolucao_${nomeGrupo}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        }
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                      <Download size={16} /> Baixar Gráfico
                    </button>
                  </div>
                </div>

                {/* Mini Ranking (1/3 no Desktop) */}
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Seus Rankings</h2>
                    <Link to="/ranking" className="text-blue-600 text-sm font-bold hover:underline flex items-center gap-1">
                      Ver todos <ChevronRight size={14} />
                    </Link>
                  </div>

                  {meusRankings.length > 0 ? (
                    <div className="space-y-4 mb-8">
                      {meusRankings.map((rk) => (
                        <div key={rk.id} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 flex items-center justify-between transition-all hover:border-blue-200">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{rk.nome}</p>
                            <p className="text-lg font-bold text-slate-700">
                              {rk.rank}º <span className="text-slate-400 font-medium text-sm">de {rk.total}</span>
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                            <Trophy size={20} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                        <Trophy size={32} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Cadastre ativos para competir nos rankings globais.</p>
                    </div>
                  )}

                  {/* Ranking Global - Sua Posição (Simulado pelo rankingData se houver) */}
                  <div className="mt-auto pt-6 border-t border-slate-50">
                    <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                      <div className="flex justify-between items-start mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Global</p>
                        <Trophy size={16} className="text-yellow-400" />
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-black tracking-tight">#{rankingData.findIndex(u => u.nome === login) + 1 || '-'}</p>
                          <p className="text-[10px] font-bold opacity-60">Sua Posição Geral</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-400">{rankingData.length} Grupos</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allocation Hub */}
              <AllocationCharts 
                ativos={ativos} 
                caixaFixa={valorFixaDisponivel} 
                caixaVariavel={valorVariavelDisponivel} 
              />

              {/* Seção Minha Carteira */}
              <div className="flex justify-between items-center mb-6 animate-fade-in delay-300">
                <h2 className="text-2xl font-bold text-slate-800">Minha Carteira</h2>
                <button
                  onClick={() => openModal(setShowWizard)}
                  className="text-blue-600 font-bold text-sm hover:underline"
                >
                  Nova Operação
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
                {ativos.map((ativo, index) => (
                  <motion.div
                    key={ativo.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <AtivoCard
                      ativo={ativo}
                      onSell={handleSellAtivo}
                      cor={getCorAtivo(ativo.id)}
                      onInformarDividendo={
                        (ativo.tipo === 'rendaVariavel' && ativo.subtipo === 'fii')
                          ? () => handleVerificarDividendos(ativo)
                          : undefined
                      }
                    />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl">Nenhum ativo cadastrado. Adicione seu primeiro ativo para começar.</div>
          )}
        </div> {/* This closing div was missing in the original code, it closes the "flex-1 flex flex-col p-4 md:p-10 overflow-y-auto custom-scrollbar" div */}

        {showWizard && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col">
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
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col">
            <VendaAtivoModal
              ativo={ativoSelecionado}
              onClose={() => setShowVendaModal(false)}
              onConfirm={confirmarVenda}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        {showDepositar && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col">
            <DepositarModal
              onClose={() => setShowDepositar(false)}
              onConfirm={handleDeposito}
              saldoFixa={valorFixaDisponivel}
              saldoVariavel={valorVariavelDisponivel}
            />
          </div>
        )}

        {mostrarModalIR && resumosIR && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col">
            <DeduzirIRModal
              resumosIR={resumosIR}
              saldoVariavel={valorVariavelDisponivel}
              onClose={() => setMostrarModalIR(false)}
              onConfirm={async (senhaDigitada) => {
                if (senhaDigitada !== senhaSalva) {
                  alert('Senha incorreta!');
                  return false;
                }

                for (const resumo of resumosIR) {
                  if (resumo.imposto > 0 && mesEncerrado(resumo.mes)) {
                    const registroIR: RegistroHistorico = {
                      tipo: 'ir',
                      valor: resumo.imposto,
                      categoria: 'rendaVariavel',
                      subtipo: resumo.subtipo as 'acao' | 'fii' | 'criptomoeda',
                      data: new Date().toISOString(),
                      mesApuracao: resumo.mes
                    };

                    setValorVariavelDisponivel(prev => prev - resumo.imposto);
                    setHistorico(prev => [...prev, registroIR]);

                    const docRef = doc(db, 'usuarios', login);
                    await updateDoc(docRef, {
                      historico: arrayUnion(registroIR),
                    });
                  }
                }

                setMostrarModalIR(false);
                alert('Dedução de Imposto de Renda confirmada e salva com sucesso!');
                return true;
              }}
            />
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-hidden flex flex-col">
            <ExcluirGrupoModal
              nomeGrupo={nomeGrupo}
              onClose={() => setShowDeleteModal(false)}
              onConfirm={async (senhaDigitada) => {
                if (senhaDigitada !== senhaSalva) {
                  alert('Senha incorreta!');
                  return;
                }

                setLoading(true);
                try {
                  // 1. Apaga o documento do Firestore
                  await deleteDoc(doc(db, "usuarios", login));
                  if (fotoGrupo) {
                    const fotoRef = ref(storage, fotoGrupo);
                    await deleteObject(fotoRef).catch((error) => {
                      if (error.code !== 'storage/object-not-found') throw error;
                    });
                  }
                  alert('Grupo excluído com sucesso. Você será desconectado.');
                  window.location.reload();
                } catch (error) {
                  console.error("Erro ao excluir grupo:", error);
                  alert("Ocorreu um erro ao tentar excluir o grupo.");
                  setLoading(false);
                }
              }}
            />
          </div>
        )}

        {showTransferencia && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar">
            <TransferenciaModal
              saldoFixa={valorFixaDisponivel}
              saldoVariavel={valorVariavelDisponivel}
              onClose={() => setShowTransferencia(false)}
              onConfirm={async (valor, direcao, senhaDigitada) => {
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
              }}
            />
          </div>
        )}

        {showHistorico && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar">
            <HistoricoModal
              historico={historico}
              onClose={() => setShowHistorico(false)}
              nomeGrupo={nomeGrupo}
            />
          </div>
        )}

        {showDividendosPendentesModal && ativoDividendo && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar">
            <InformarDividendosPendentesModal
              nomeFII={ativoDividendo.nome}
              tickerFII={ativoDividendo.tickerFormatado}
              pendencias={pendenciasDividendo}
              onClose={() => setShowDividendosPendentesModal(false)}
              onConfirm={handleConfirmarDividendos}
            />
          </div>
        )}

        {showAtualizarModal && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar">
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
                setTimeout(() => setBloqueado(false), 1 * 60 * 1000);
                setShowAtualizarModal(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
