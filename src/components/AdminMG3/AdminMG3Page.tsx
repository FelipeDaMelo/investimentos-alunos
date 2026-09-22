import React, { useState, useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { storage } from '../../firebaseConfig';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Briefcase, Building2, TrendingUp, Trash2, Edit2, LayoutDashboard, Clock, Settings, ShieldAlert } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'empresas' | 'cenarios' | 'configuracoes'>('empresas');
  const [setores, setSetores] = useState<string[]>(DEFAULT_SETORES);
  const navigate = useNavigate();

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const uniqueName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `logos_mg3/${uniqueName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setNovoAtivo({ ...novoAtivo, logo: downloadURL });
    } catch (error) {
      console.error("Erro ao subir logo:", error);
      alert("Erro ao fazer upload da logo.");
    } finally {
      setUploadingLogo(false);
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
      const payload: any = {
        nome: novoAtivo.nome,
        ticker: novoAtivo.ticker.toUpperCase(),
        tipo: novoAtivo.tipo,
        setor: novoAtivo.tipo === 'rendaFixa' ? 'Bancário' : novoAtivo.setor,
        logo: novoAtivo.logo || 'https://via.placeholder.com/150?text=' + novoAtivo.ticker,
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
      setNovoAtivo({ ...novoAtivo, nome: '', ticker: '', precoAtual: '', taxaRendimentoHora: '', totalAcoes: '' });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ativo.');
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo do Ativo (Opcional)</label>
                  <div className="flex items-center gap-4">
                    {novoAtivo.logo && (
                      <img src={novoAtivo.logo} alt="Preview" className="w-12 h-12 rounded-full object-cover border" />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </div>
                  </div>
                  {uploadingLogo && <p className="text-sm text-blue-500 mt-1">Enviando imagem...</p>}
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
                    <img src={ativo.logo} alt={ativo.ticker} className="w-12 h-12 rounded-full object-cover bg-slate-100" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{ativo.ticker}</h3>
                      <p className="text-xs text-slate-500">{ativo.nome} • {ativo.tipo}</p>
                      {ativo.tipo === 'rendaFixa' ? (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          +{(ativo.taxaRendimentoHora * 100).toFixed(2)}% a hora
                        </p>
                      ) : (
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          $ {ativo.precoAtual?.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(ativo.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={20} />
                    </button>
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
    </div>
  );
}
