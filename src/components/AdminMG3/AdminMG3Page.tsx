import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { storage } from '../../firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Briefcase, Building2, TrendingUp, Trash2, Edit2, LayoutDashboard, Clock, Settings, ShieldAlert, X, Image as ImageIcon, QrCode, Copy, ExternalLink, Printer, Check } from 'lucide-react';
import AdminPasswordModal from '../Ranking/AdminPasswordModal';
import { useNavigate } from 'react-router-dom';

interface AdminMG3PageProps {
  login: string;
  fotoGrupo: string | null;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
  onImpersonate?: (userId: string, fotoGrupo: string | null) => void;
}

const DEFAULT_SETORES = [
  'Bancário',
  'Saúde',
  'Energia',
  'Matéria prima: pedras preciosas',
  'Turismo',
  'Educação',
  'Alimentos',
  'Varejo',
  'Tecnologia'
];

export default function AdminMG3Page({ login }: AdminMG3PageProps) {
  const [autenticado, setAutenticado] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [ativos, setAtivos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'empresas' | 'cenarios' | 'configuracoes' | 'qrcode'>('empresas');
  const [copiado, setCopiado] = useState(false);
  const [setores, setSetores] = useState<string[]>(DEFAULT_SETORES);
  const navigate = useNavigate();

  // Estados para edição de ativo existente
  const [ativoEditando, setAtivoEditando] = useState<any | null>(null);
  const [uploadingEditLogo, setUploadingEditLogo] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Estado para Configurações Globais
  const [mg3Config, setMg3Config] = useState({
    capitalInicial: 100000,
    percentualFixa: 40,
    sensibilidade: 100000
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Estado para Cenários
  const DEFAULT_NOTICIAS = Array.from({ length: 9 }, (_, i) => `NOTICIA${i + 1}`);
  const [cenariosKeys, setCenariosKeys] = useState<string[]>(DEFAULT_NOTICIAS);
  const [cenarios, setCenarios] = useState<Record<string, Record<string, number>>>(
    Object.fromEntries(DEFAULT_NOTICIAS.map(n => [n, Object.fromEntries(DEFAULT_SETORES.map(s => [s, 0]))]))
  );
  const [isSavingCenarios, setIsSavingCenarios] = useState(false);
  const [novoSetor, setNovoSetor] = useState('');

  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    ticker: '',
    tipo: 'acao',
    setor: setores[0] || '',
    precoAtual: '',
    taxaRendimentoHora: '',
    totalAcoes: '',
    logo: ''
  });

  const carregarConfiguracoes = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'admin', 'mg3_config'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMg3Config({
          capitalInicial: data.capitalInicial ?? 100000,
          percentualFixa: data.percentualFixa ?? 40,
          sensibilidade: data.sensibilidade ?? 100000
        });
      }
    } catch (e) {
      console.error('Erro ao carregar configurações globais:', e);
    }
  };

  const salvarConfiguracoes = async () => {
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'admin', 'mg3_config'), mg3Config);
      alert('Configurações salvas com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Upload no Firebase Storage usando a pasta com permissão de escrita
  const uploadImageFile = async (file: File): Promise<string> => {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `logo_mg3_${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, `fotosGrupos/${uniqueName}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const downloadURL = await uploadImageFile(file);
      setNovoAtivo(prev => ({ ...prev, logo: downloadURL }));
    } catch (error: any) {
      console.error("Erro ao subir logo:", error);
      alert(`Erro ao fazer upload da logo: ${error?.message || 'Permissão negada ou erro na rede'}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const abrirEdicaoAtivo = (ativo: any) => {
    setAtivoEditando({
      ...ativo,
      taxaRendimentoHora: ativo.tipo === 'rendaFixa' && ativo.taxaRendimentoHora != null
        ? (Number(ativo.taxaRendimentoHora) * 100).toString()
        : '',
      precoAtual: ativo.precoAtual != null ? ativo.precoAtual.toString() : '',
      totalAcoes: ativo.totalAcoes != null ? ativo.totalAcoes.toString() : '',
      logo: ativo.logo || ''
    });
  };

  const handleEditLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingEditLogo(true);
    try {
      const downloadURL = await uploadImageFile(file);
      setAtivoEditando((prev: any) => prev ? ({ ...prev, logo: downloadURL }) : null);
    } catch (error: any) {
      console.error("Erro ao subir logo da edição:", error);
      alert(`Erro ao fazer upload da logo: ${error?.message || 'Permissão negada ou erro na rede'}`);
    } finally {
      setUploadingEditLogo(false);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ativoEditando) return;

    setIsSavingEdit(true);
    try {
      const tickerFormatado = (ativoEditando.ticker || '').toUpperCase();
      const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(tickerFormatado)}&background=0284c7&color=fff&bold=true`;

      const payload: any = {
        nome: ativoEditando.nome,
        ticker: tickerFormatado,
        tipo: ativoEditando.tipo,
        setor: ativoEditando.tipo === 'rendaFixa' ? 'Bancário' : (ativoEditando.setor || setores[0] || 'Geral'),
        logo: (ativoEditando.logo && ativoEditando.logo.trim()) ? ativoEditando.logo.trim() : defaultLogo,
      };

      if (ativoEditando.tipo === 'rendaFixa') {
        payload.taxaRendimentoHora = parseFloat(ativoEditando.taxaRendimentoHora || '0') / 100;
        payload.precoAtual = 1;
      } else {
        payload.precoAtual = parseFloat(ativoEditando.precoAtual || '0');
        payload.totalAcoes = parseFloat(ativoEditando.totalAcoes || '0');
      }

      await updateDoc(doc(db, 'mg3_mercado', ativoEditando.id), payload);
      alert('Ativo atualizado com sucesso!');
      setAtivoEditando(null);
      carregarAtivos();
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao atualizar ativo: ${err?.message || 'Erro'}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const carregarAtivos = async () => {
    const snap = await getDocs(collection(db, 'mg3_mercado'));
    const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setAtivos(dados);

    // Carregar cenários
    const snapCenarios = await getDocs(collection(db, 'mg3_cenarios'));
    if (!snapCenarios.empty) {
      const docCenario = snapCenarios.docs[0];
      const data = docCenario.data().cenarios;
      if (docCenario.data().setores) {
        setSetores(docCenario.data().setores);
      }
      if (data) {
        setCenarios(data);
        const keys = Object.keys(data).sort((a, b) => {
          const numA = parseInt(a.replace('NOTICIA', '')) || 0;
          const numB = parseInt(b.replace('NOTICIA', '')) || 0;
          return numA - numB;
        });
        if (keys.length > 0) {
          setCenariosKeys(keys);
        }
      }
    }
  };

  const handleSalvarAtivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tickerFormatado = novoAtivo.ticker.toUpperCase();
      const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(tickerFormatado)}&background=0284c7&color=fff&bold=true`;

      const payload: any = {
        nome: novoAtivo.nome,
        ticker: tickerFormatado,
        tipo: novoAtivo.tipo,
        setor: novoAtivo.tipo === 'rendaFixa' ? 'Bancário' : novoAtivo.setor,
        logo: (novoAtivo.logo && novoAtivo.logo.trim()) ? novoAtivo.logo.trim() : defaultLogo,
        oferta: 0,
        demanda: 0,
      };

      if (novoAtivo.tipo === 'rendaFixa') {
        payload.taxaRendimentoHora = parseFloat(novoAtivo.taxaRendimentoHora) / 100;
        payload.precoAtual = 1; // Valor base de 1 para RF
      } else {
        payload.precoAtual = parseFloat(novoAtivo.precoAtual);
        payload.totalAcoes = parseFloat(novoAtivo.totalAcoes);
      }

      await addDoc(collection(db, 'mg3_mercado'), payload);
      alert('Ativo MG3 cadastrado com sucesso!');
      carregarAtivos();
      setNovoAtivo({
        nome: '',
        ticker: '',
        tipo: 'acao',
        setor: setores[0] || '',
        precoAtual: '',
        taxaRendimentoHora: '',
        totalAcoes: '',
        logo: ''
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar ativo: ${err?.message || 'Erro desconhecido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ativo do mercado MG3?')) {
      await deleteDoc(doc(db, 'mg3_mercado', id));
      carregarAtivos();
    }
  };

  const handleCenarioChange = (hora: string, setor: string, value: string) => {
    const num = parseFloat(value) || 0;
    setCenarios(prev => ({
      ...prev,
      [hora]: {
        ...prev[hora],
        [setor]: num
      }
    }));
  };

  const getBalancoSetor = (setor: string) => {
    return cenariosKeys.reduce((acc, key) => acc + (cenarios[key]?.[setor] || 0), 0);
  };

  const todosZerados = setores.every(setor => getBalancoSetor(setor) === 0);

  const adicionarNoticia = () => {
    const nextKey = `NOTICIA${cenariosKeys.length + 1}`;
    setCenariosKeys(prev => [...prev, nextKey]);
    setCenarios(prev => ({
      ...prev,
      [nextKey]: Object.fromEntries(setores.map(s => [s, 0]))
    }));
  };

  const handleAddSetor = () => {
    if (!novoSetor || setores.includes(novoSetor)) return;
    setSetores(prev => [...prev, novoSetor]);
    setCenarios(prev => {
      const newCenarios = { ...prev };
      Object.keys(newCenarios).forEach(key => {
        newCenarios[key] = { ...newCenarios[key], [novoSetor]: 0 };
      });
      return newCenarios;
    });
    setNovoSetor('');
  };

  const handleRemoveSetor = (setorToRemove: string) => {
    if (!confirm(`Tem certeza que deseja remover o setor ${setorToRemove}?`)) return;
    setSetores(prev => prev.filter(s => s !== setorToRemove));
    setCenarios(prev => {
      const newCenarios = { ...prev };
      Object.keys(newCenarios).forEach(key => {
        const copy = { ...newCenarios[key] };
        delete copy[setorToRemove];
        newCenarios[key] = copy;
      });
      return newCenarios;
    });
  };

  const handleSalvarCenarios = async () => {
    if (!todosZerados) {
      alert("Erro: O balanço de todos os setores deve ser exatamente 0% para salvar.");
      return;
    }
    setIsSavingCenarios(true);
    try {
      await setDoc(doc(db, 'mg3_cenarios', 'config_principal'), { cenarios, setores });
      alert("Cenários salvos com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cenários.");
    } finally {
      setIsSavingCenarios(false);
    }
  };

  if (!autenticado) {
    return (
      <div className="flex h-screen bg-slate-900 overflow-hidden relative">
        {/* Usamos o mesmo modal da página de Admin */}
        <AdminPasswordModal 
          title="Admin MG3"
          onClose={() => navigate('/')}
          onConfirm={(senhaInformada) => {
            const adminPassword = import.meta.env.VITE_ADMIN_MG3_PASSWORD;
            if (adminPassword && senhaInformada === adminPassword) {
              setAutenticado(true);
              carregarAtivos();
              carregarConfiguracoes();
            } else {
              alert("Senha incorreta! Acesso negado.");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <img src="/MG3_LOGO.png" alt="MG3 Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Painel Administrativo MG3</h1>
              <p className="text-slate-500">Controle de Ativos e Cenários da Mostra Científica e Cultural</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('empresas')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'empresas' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <LayoutDashboard size={18} /> Empresas
            </button>
            <button
              onClick={() => setActiveTab('cenarios')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'cenarios' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Clock size={18} /> Cenários
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'configuracoes' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Settings size={18} /> Configurações
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'qrcode' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <QrCode size={18} /> QR Code do Evento
            </button>
          </div>
        </header>

        {activeTab === 'configuracoes' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Settings className="text-blue-600" />
              Configurações Globais (Novos Grupos)
            </h2>
            <p className="text-slate-500 mb-8">Defina o valor inicial e a proporção de saldo para grupos que criarem conta no MG3.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capital Inicial (GloriaCoins)</label>
                <input
                  type="number"
                  value={mg3Config.capitalInicial}
                  onChange={e => setMg3Config({ ...mg3Config, capitalInicial: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Porcentagem em Renda Fixa (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={mg3Config.percentualFixa}
                  onChange={e => {
                    let val = Number(e.target.value);
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    setMg3Config({ ...mg3Config, percentualFixa: val });
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs font-bold text-slate-500 mt-2">
                  Vai para Renda Variável: <span className="text-blue-500">{100 - mg3Config.percentualFixa}%</span>
                </p>
              </div>
            </div>
            <div className="mt-8">
              <button
                onClick={salvarConfiguracoes}
                disabled={isSavingConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'qrcode' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-10 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full mb-2">
                  <QrCode size={14} /> Mostra Cultural MG3
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  QR Code Oficial para Adicionar Ativos
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1 max-w-2xl">
                  Ao escanear este QR Code com o celular, o aluno que <b>não estiver logado</b> será solicitado a identificar sua equipe no MG3. Logo após o login, a plataforma abre <b>imediatamente a tela para decidir entre Renda Fixa ou Renda Variável</b>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Placa QR Code - Bolsa MG3</title>
                          <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; text-align: center; }
                            .card { border: 4px solid #2563eb; border-radius: 32px; padding: 48px; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
                            .badge { background: #dbeafe; color: #1e40af; font-weight: 800; font-size: 13px; text-transform: uppercase; padding: 6px 16px; border-radius: 999px; display: inline-block; margin-bottom: 16px; }
                            h1 { font-size: 28px; font-weight: 900; margin: 0 0 8px; color: #0f172a; }
                            p { font-size: 14px; color: #64748b; margin: 0 0 24px; line-height: 1.5; font-weight: 500; }
                            img { width: 280px; height: 280px; border-radius: 20px; border: 2px solid #e2e8f0; margin-bottom: 24px; }
                            .steps { text-align: left; background: #f8fafc; border-radius: 18px; padding: 16px 20px; font-size: 12px; color: #334155; font-weight: 700; line-height: 1.8; }
                            .footer { margin-top: 20px; font-size: 11px; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="badge">Mostra Científica & Cultural</div>
                            <h1>Bolsa MG3</h1>
                            <p>Aponte a câmera do seu celular para entrar na sua equipe e investir em <b>Renda Fixa</b> ou <b>Renda Variável</b>!</p>
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=15&data=${encodeURIComponent(`${window.location.origin}/mg3/investir`)}" alt="QR Code Bolsa MG3" />
                            <div class="steps">
                              1. Aponte a câmera do celular para o código acima<br/>
                              2. Entre com o nome e a senha de 6 dígitos da sua equipe<br/>
                              3. Escolha a categoria e aplique suas GloriaCoins!
                            </div>
                            <div class="footer">Simulador de Investimentos MG3</div>
                          </div>
                          <script>
                            window.onload = function() { window.print(); }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all text-sm"
                >
                  <Printer size={16} /> Imprimir Placa A4
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="bg-gradient-to-b from-blue-50 to-slate-50 border-2 border-blue-200 p-6 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-md shadow-blue-500/30">
                    <QrCode size={22} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">Bolsa MG3 - Investir</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">Escolha entre Renda Fixa e Renda Variável</p>

                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(`${window.location.origin}/mg3/investir`)}`}
                      alt="QR Code MG3"
                      className="w-56 h-56 rounded-xl object-contain"
                    />
                  </div>

                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Escaneie para testar no celular
                  </p>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Link Direto do QR Code
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 pl-4">
                    <span className="text-xs md:text-sm font-mono font-bold text-slate-700 truncate flex-1">
                      {window.location.origin}/mg3/investir
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/mg3/investir`);
                        setCopiado(true);
                        setTimeout(() => setCopiado(false), 2000);
                      }}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0"
                    >
                      {copiado ? (
                        <>
                          <Check size={14} className="text-green-600" />
                          <span className="text-green-600">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="text-slate-500" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                    <a
                      href="/mg3/investir"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <ExternalLink size={14} />
                      <span>Testar Acesso</span>
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-blue-600" /> Como funciona o fluxo do aluno
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 font-medium">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-[10px]">1</span>
                      <span><b>Aluno escaneia o QR Code</b> em qualquer lugar do evento através da câmera do celular.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-[10px]">2</span>
                      <span><b>Se ainda não estiver logado:</b> cai na tela de acesso da Bolsa MG3 com aviso de QR Code e digita o nome e senha da sua equipe.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-[10px]">3</span>
                      <span><b>Redirecionamento automático:</b> assim que autentica, o painel abre instantaneamente a tela de decisão entre <b>Renda Fixa</b> e <b>Renda Variável</b>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-[10px]">4</span>
                      <span><b>Se já estiver logado:</b> vai direto para a tela de escolha sem pedir login novamente!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'empresas' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-fit">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Building2 className="text-slate-400" /> Cadastrar Empresa
              </h2>

              <form onSubmit={handleSalvarAtivo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ativo</label>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoAtivo.tipo}
                    onChange={e => setNovoAtivo({ ...novoAtivo, tipo: e.target.value })}
                  >
                    <option value="acao">Ação (Renda Variável)</option>
                    <option value="criptomoeda">Criptomoeda</option>
                    <option value="rendaFixa">Banco (Renda Fixa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa / Banco</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: GLoriaTech"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoAtivo.nome}
                    onChange={e => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código (Ticker)</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: GLTE3"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={novoAtivo.ticker}
                    onChange={e => setNovoAtivo({ ...novoAtivo, ticker: e.target.value.toUpperCase() })}
                  />
                </div>

                {novoAtivo.tipo !== 'rendaFixa' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                      <select
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={novoAtivo.setor}
                        onChange={e => setNovoAtivo({ ...novoAtivo, setor: e.target.value })}
                      >
                        {setores.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preço Inicial (GloriaCoins)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        placeholder="Ex: 15.50"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={novoAtivo.precoAtual}
                        onChange={e => setNovoAtivo({ ...novoAtivo, precoAtual: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Total de Ações Emitidas</label>
                      <input
                        required
                        type="number"
                        placeholder="Ex: 100000"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={novoAtivo.totalAcoes}
                        onChange={e => setNovoAtivo({ ...novoAtivo, totalAcoes: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {novoAtivo.tipo === 'rendaFixa' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Taxa de Rendimento (% a hora)</label>
                    <input
                      type="number"
                      className="w-full p-4 bg-slate-100 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all font-bold"
                      placeholder="Ex: 0.5"
                      step="0.01"
                      value={novoAtivo.taxaRendimentoHora}
                      onChange={e => setNovoAtivo({ ...novoAtivo, taxaRendimentoHora: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <label className="block text-sm font-medium text-slate-700">Logo da Empresa (Opcional)</label>

                  {novoAtivo.logo && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <img 
                        src={novoAtivo.logo} 
                        alt="Preview" 
                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(novoAtivo.ticker || 'EM')}&background=0284c7&color=fff&bold=true`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{novoAtivo.logo}</p>
                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                          Logo pronta para cadastrar
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setNovoAtivo(prev => ({ ...prev, logo: '' }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Remover logo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                    />
                    {uploadingLogo && <p className="text-xs text-blue-600 animate-pulse font-medium">Fazendo upload da imagem para o Firebase...</p>}

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-slate-400 font-medium">Ou cole a URL direta da imagem:</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/logo.png"
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={novoAtivo.logo}
                      onChange={e => setNovoAtivo(prev => ({ ...prev, logo: e.target.value }))}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-4">
                  <TrendingUp size={20} /> Cadastrar Ativo MG3
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Mercado Ativo ({ativos.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ativos.map(ativo => (
                  <div key={ativo.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <img 
                      src={ativo.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ativo.ticker)}&background=0284c7&color=fff&bold=true`} 
                      alt={ativo.ticker} 
                      className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-100 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ativo.ticker)}&background=0284c7&color=fff&bold=true`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">{ativo.ticker}</h3>
                      <p className="text-xs text-slate-500 truncate">{ativo.nome} • {ativo.tipo}</p>
                      {ativo.tipo === 'rendaFixa' ? (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          +{(Number(ativo.taxaRendimentoHora || 0) * 100).toFixed(2)}% a hora
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          $ {Number(ativo.precoAtual || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => abrirEdicaoAtivo(ativo)} 
                        title="Editar Ativo / Imagem"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(ativo.id)} 
                        title="Excluir Ativo"
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {ativos.length === 0 && (
                  <div className="col-span-2 text-center p-10 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-500">Nenhuma empresa cadastrada no MG3 ainda.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
        {activeTab === 'cenarios' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Configuração de Cenários (Notícias)</h2>
                <p className="text-slate-500 mt-2 max-w-3xl">
                  Defina a variação percentual que impactará todo um <b>Setor</b> de uma só vez a cada "Momento" da mostra.
                  Para garantir justiça no simulador, a regra de <b>Variação Líquida Zero</b> exige que o somatório de cada setor no final do dia seja exatos 0%.
                </p>
              </div>
              <button
                onClick={adicionarNoticia}
                className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                + Adicionar Notícia
              </button>
            </div>

            {/* Gerenciamento de Setores */}
            <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <input
                type="text"
                placeholder="Nome do novo setor..."
                className="flex-1 p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                value={novoSetor}
                onChange={e => setNovoSetor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSetor()}
              />
              <button
                onClick={handleAddSetor}
                className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 transition-colors whitespace-nowrap"
              >
                Adicionar Setor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-500 text-sm">
                    <th className="p-4 font-black tracking-wider uppercase">Setor</th>
                    {cenariosKeys.map((key, index) => (
                      <th key={key} className={`p-4 font-black tracking-wider uppercase text-center bg-blue-50/50 ${index === 0 ? 'rounded-tl-xl' : ''} ${index === cenariosKeys.length - 1 ? 'rounded-tr-xl' : ''}`}>
                        {key} (%)
                      </th>
                    ))}
                    <th className="p-4 font-black tracking-wider uppercase text-right">Balanço do Dia</th>
                  </tr>
                </thead>
                <tbody>
                  {setores.map(setor => {
                    const balanco = getBalancoSetor(setor);
                    const isZerado = balanco === 0;

                    return (
                      <tr key={setor} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-700 flex justify-between items-center min-w-[200px]">
                          {setor}
                          <button onClick={() => handleRemoveSetor(setor)} className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                        {cenariosKeys.map(key => (
                          <td key={key} className="p-4 text-center">
                            <input
                              type="number"
                              value={cenarios[key]?.[setor] || 0}
                              onChange={e => handleCenarioChange(key, setor, e.target.value)}
                              className="w-20 p-2 text-center bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </td>
                        ))}
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-black text-sm ${isZerado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {balanco > 0 ? '+' : ''}{balanco.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div>
                {!todosZerados ? (
                  <p className="text-red-500 font-bold flex items-center gap-2">
                    O balanço de todos os setores deve ser zero para salvar.
                  </p>
                ) : (
                  <p className="text-green-600 font-bold flex items-center gap-2">
                    Todos os setores equilibrados! Pronto para salvar.
                  </p>
                )}
              </div>
              <button
                onClick={handleSalvarCenarios}
                disabled={!todosZerados || isSavingCenarios}
                className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSavingCenarios ? 'Salvando...' : 'Salvar Cenários MG3'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição de Empresa / Ativo */}
      {ativoEditando && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Editar {ativoEditando.ticker}</h2>
                  <p className="text-xs text-slate-500">Altere os dados e a imagem da empresa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAtivoEditando(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvarEdicao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa / Banco</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ativoEditando.nome}
                  onChange={e => setAtivoEditando({ ...ativoEditando, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código (Ticker)</label>
                <input
                  required
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={ativoEditando.ticker}
                  onChange={e => setAtivoEditando({ ...ativoEditando, ticker: e.target.value.toUpperCase() })}
                />
              </div>

              {ativoEditando.tipo !== 'rendaFixa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={ativoEditando.setor}
                      onChange={e => setAtivoEditando({ ...ativoEditando, setor: e.target.value })}
                    >
                      {setores.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preço Atual (GloriaCoins)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={ativoEditando.precoAtual}
                      onChange={e => setAtivoEditando({ ...ativoEditando, precoAtual: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total de Ações Emitidas</label>
                    <input
                      required
                      type="number"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={ativoEditando.totalAcoes}
                      onChange={e => setAtivoEditando({ ...ativoEditando, totalAcoes: e.target.value })}
                    />
                  </div>
                </>
              )}

              {ativoEditando.tipo === 'rendaFixa' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Taxa de Rendimento (% a hora)</label>
                  <input
                    type="number"
                    className="w-full p-4 bg-slate-100 rounded-xl focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all font-bold"
                    placeholder="Ex: 0.5"
                    step="0.01"
                    value={ativoEditando.taxaRendimentoHora}
                    onChange={e => setAtivoEditando({ ...ativoEditando, taxaRendimentoHora: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700">Logo da Empresa</label>
                
                {ativoEditando.logo && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <img 
                      src={ativoEditando.logo} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ativoEditando.ticker || 'EM')}&background=0284c7&color=fff&bold=true`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-600 truncate">{ativoEditando.logo}</p>
                      <span className="text-[10px] text-green-600 font-bold">Logo configurada</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setAtivoEditando({ ...ativoEditando, logo: '' });
                        if (editFileInputRef.current) editFileInputRef.current.value = '';
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Remover logo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                    onChange={handleEditLogoUpload}
                    disabled={uploadingEditLogo}
                  />
                  {uploadingEditLogo && <p className="text-xs text-blue-600 animate-pulse font-medium">Fazendo upload da imagem para o Firebase...</p>}
                  
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-400 font-medium">Ou cole a URL direta da imagem:</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/logo.png"
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={ativoEditando.logo || ''}
                    onChange={e => setAtivoEditando({ ...ativoEditando, logo: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setAtivoEditando(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || uploadingEditLogo}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
