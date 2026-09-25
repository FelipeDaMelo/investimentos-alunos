import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Plus, Calendar, Wallet, Lock, MessageSquare, Search, Tag, Hash, TrendingUp } from 'lucide-react';
import { criarAtivoVariavel } from '../../utils/ativoHelpers';
import { RendaVariavelAtivo } from '../../types/Ativo';
import fetchValorAtual from '../../fetchValorAtual';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const Spinner = ({ className = "" }: { className?: string }) => (
  <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${className}`} />
);

interface RendaVariavelStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaVariavelAtivo, comentario: string) => void;
  saldoDisponivel: number;
  isMG3?: boolean;
}

export default function RendaVariavelStep({ onBack, onSubmit, saldoDisponivel, isMG3 }: RendaVariavelStepProps) {
  const [senha, setSenha] = useState('');
  const [comentario, setComentario] = useState('');
  const [dividendoFII, setDividendoFII] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: '',
    dataInvestimento: new Date().toISOString().split('T')[0],
    subtipo: 'acao' as 'acao' | 'fii' | 'criptomoeda',
    quantidade: '',
    precoAtual: 0,
    logo: '' as string | undefined,
    loadingPreco: false,
    errorPreco: ''
  });

  const [empresasMG3, setEmpresasMG3] = useState<any[]>([]);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(isMG3);

  const getQuantidadeNumerica = (): number => {
    if (form.quantidade === '') return 0;
    const value = form.quantidade.replace(',', '.');
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const valorTotal = getQuantidadeNumerica() * form.precoAtual;

  // Carregar catálogo oficial de empresas cadastradas no MG3
  useEffect(() => {
    if (!isMG3) return;

    const carregarCatalogoMG3 = async () => {
      try {
        setCarregandoEmpresas(true);
        const snap = await getDocs(collection(db, 'mg3_mercado'));
        const dados = snap.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as any) }))
          .filter(a => a.tipo === 'acao' || a.tipo === 'criptomoeda' || !a.tipo);
        setEmpresasMG3(dados);
      } catch (err) {
        console.error('Erro ao carregar empresas do mercado MG3:', err);
      } finally {
        setCarregandoEmpresas(false);
      }
    };

    carregarCatalogoMG3();
  }, [isMG3]);

  useEffect(() => {
    const buscarPrecoComDebounce = setTimeout(() => {
      if (form.nome.trim().length >= 2) {
        buscarPreco();
      }
    }, 500);
    return () => clearTimeout(buscarPrecoComDebounce);
  }, [form.nome, form.subtipo]);

  const handleSelecionarEmpresaMG3 = (empresa: any) => {
    setForm(prev => ({
      ...prev,
      nome: (empresa.ticker || '').toUpperCase(),
      precoAtual: empresa.precoAtual || 1,
      logo: empresa.logo || '',
      subtipo: empresa.tipo === 'criptomoeda' ? 'criptomoeda' : 'acao',
      loadingPreco: false,
      errorPreco: ''
    }));
  };

  const buscarPreco = async () => {
    try {
      setForm(prev => ({ ...prev, loadingPreco: true, errorPreco: '' }));
      setDividendoFII(null);

      let preco = 0;
      let logo = '';

      if (isMG3) {
        const queryTerm = form.nome.toUpperCase().trim();
        const snap = await getDocs(collection(db, 'mg3_mercado'));
        const ativosMg3 = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

        const ativoEncontrado = ativosMg3.find(a =>
          (a.ticker && a.ticker.toUpperCase() === queryTerm) ||
          (a.nome && a.nome.toUpperCase() === queryTerm)
        );

        if (!ativoEncontrado) throw new Error('Ativo não encontrado no mercado MG3');

        preco = ativoEncontrado.precoAtual;
        logo = ativoEncontrado.logo || '';

        setForm(prev => ({
          ...prev,
          precoAtual: preco,
          logo: logo,
          loadingPreco: false,
          subtipo: ativoEncontrado.tipo === 'criptomoeda' ? 'criptomoeda' : 'acao',
          nome: ativoEncontrado.ticker || prev.nome.toUpperCase(),
        }));
      } else {
        const tickerFormatado = formatarTicker(form.nome, form.subtipo);
        const result = await fetchValorAtual(tickerFormatado, form.subtipo === 'criptomoeda' ? 'crypto' : 'stock');
        if (result.valor === 'Erro ao carregar') throw new Error('Não foi possível obter o preço');
        preco = parseFloat(result.valor);
        logo = result.logo || '';

        setForm(prev => ({
          ...prev,
          precoAtual: preco,
          logo: logo,
          loadingPreco: false,
          nome: formatarTickerParaExibicao(prev.nome, prev.subtipo),
        }));
      }
    } catch (error) {
      setForm(prev => ({ ...prev, loadingPreco: false, errorPreco: error instanceof Error ? error.message : 'Erro' }));
    }
  };

  const formatarTicker = (ticker: string, tipo: string) => {
    const tickerLimpo = ticker.toUpperCase().trim();
    if (isMG3) return tickerLimpo; // No MG3 não utilizamos sufixos como .SA
    if (tipo === 'criptomoeda') return tickerLimpo.includes('-') ? tickerLimpo : `${tickerLimpo}-USD`;
    return tickerLimpo.endsWith('.SA') ? tickerLimpo : `${tickerLimpo}.SA`;
  };

  const formatarTickerParaExibicao = (ticker: string, tipo: string) => {
    if (isMG3) return ticker.toUpperCase();
    if (tipo === 'criptomoeda') return ticker.replace('-USD', '');
    return ticker.replace('.SA', '');
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (form.subtipo === 'criptomoeda') {
      if (/^[0-9]*[,.]?[0-9]*$/.test(rawValue)) setForm(prev => ({ ...prev, quantidade: rawValue }));
    } else {
      if (/^[0-9]*$/.test(rawValue)) setForm(prev => ({ ...prev, quantidade: rawValue }));
    }
  };

  const formatQuantidadeDisplay = () => {
    if (form.quantidade === '') return '';
    if (form.subtipo === 'criptomoeda') return form.quantidade;
    const num = getQuantidadeNumerica();
    return num === 0 ? '' : Math.floor(num).toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.length !== 6) { alert('A senha deve conter 6 dígitos.'); return; }
    const quantidadeNumerica = getQuantidadeNumerica();
    if (quantidadeNumerica <= 0) { alert('Quantidade deve ser maior que zero'); return; }
    if (form.subtipo !== 'criptomoeda' && !Number.isInteger(quantidadeNumerica)) { alert('Para este tipo de ativo, a quantidade deve ser um número inteiro'); return; }
    if (valorTotal > saldoDisponivel) { alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`); return; }

    const hoje = new Date().toISOString().split('T')[0];
    const ativoCompleto: RendaVariavelAtivo & { senha: string } = {
      ...form,
      quantidade: quantidadeNumerica,
      valorInvestido: valorTotal,
      tickerFormatado: formatarTicker(form.nome, form.subtipo),
      precoMedio: form.precoAtual,
      tipo: 'rendaVariavel',
      valorAtual: form.precoAtual,
      patrimonioPorDia: { [hoje]: valorTotal },
      id: Date.now().toString(),
      senha,
      compras: [{ valor: valorTotal, data: new Date().toISOString() }],
      dividendo: dividendoFII ?? 0,
      logo: form.logo
    };
    onSubmit(ativoCompleto, comentario);
  };

  const exemplosTicker = {
    acao: ['PETR4', 'VALE3', 'ITUB4'],
    fii: ['MXRF11', 'HGLG11', 'KNRI11'],
    criptomoeda: ['BTC', 'ETH', 'SOL']
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800">
          {isMG3 ? 'Bolsa MG3 - Renda Variável' : 'Renda Variável'}
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          {isMG3
            ? 'Selecione uma empresa ou ativo cadastrado na Mostra Cultural MG3'
            : 'Buscamos os preços reais para você'}
        </p>
      </div>

      {isMG3 && (
        <div className="space-y-3 bg-slate-50/80 p-5 rounded-3xl border border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              Empresas Disponíveis no MG3 ({empresasMG3.length})
            </span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Toque para selecionar
            </span>
          </div>

          {carregandoEmpresas ? (
            <p className="text-xs text-blue-600 font-semibold animate-pulse">Carregando mercado MG3...</p>
          ) : empresasMG3.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
              Nenhuma empresa cadastrada no MG3 ainda. Peça ao administrador para cadastrar empresas em /admin-mg3.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {empresasMG3.map(emp => {
                const isSelected = form.nome.toUpperCase() === (emp.ticker || '').toUpperCase();
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => handleSelecionarEmpresaMG3(emp)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-2xl text-left transition-all border ${isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-[1.01]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                  >
                    <img
                      src={emp.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.ticker || 'EM')}&background=0284c7&color=fff&bold=true`}
                      alt={emp.ticker}
                      className="w-11 h-11 rounded-2xl object-cover bg-white flex-shrink-0 border border-slate-100 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.ticker || 'EM')}&background=0284c7&color=fff&bold=true`;
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-black truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {emp.nome || emp.ticker}
                        </p>
                        <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-green-300' : 'text-blue-600'}`}>
                          R${Number(emp.precoAtual || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                          {emp.ticker}
                        </span>
                        {emp.setor && (
                          <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'
                            }`}>
                            • {emp.setor}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Ativo */}
          {!isMG3 && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de Ativo</label>
              <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-200 transition-colors">
                  <Tag size={18} />
                </div>
                <select
                  value={form.subtipo}
                  onChange={(e) => setForm({
                    ...form,
                    subtipo: e.target.value as any,
                    nome: '',
                    precoAtual: 0,
                    quantidade: ''
                  })}
                  className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="acao">Ação Brasileira</option>
                  <option value="fii">Fundo Imobiliário (FII)</option>
                  <option value="criptomoeda">Criptomoeda</option>
                </select>
              </div>
            </div>
          )}

          {/* Ticker */}
          <div className={`space-y-2 ${isMG3 ? 'md:col-span-2' : ''}`}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
              {isMG3 ? 'Código do Ativo (Ticker MG3)' : 'Código / Ticker'}
            </label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Search size={18} />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value.toUpperCase() })}
                  className={`w-full bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none uppercase ${form.errorPreco ? 'border-red-500' : ''}`}
                  placeholder={isMG3 ? "Ex: selecione acima ou digite o código (ex: GLTE3)" : `Ex: ${exemplosTicker[form.subtipo][0]}`}
                  required
                />
                {form.loadingPreco && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <Spinner className="h-4 w-4 text-blue-500" />
                  </div>
                )}
              </div>
            </div>
            {form.errorPreco && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
                {isMG3 ? 'Empresa não encontrada no MG3. Escolha uma da lista acima.' : (form.errorPreco === 'Não foi possível obter o preço' ? 'Ativo não encontrado ou indisponível' : form.errorPreco)}
              </p>
            )}
          </div>
        </div>

        {/* Preço e Total Card */}
        {form.precoAtual > 0 && (
          <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 grid grid-cols-2 gap-4 animate-fade-in">
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Cotação Atual</p>
              <p className="text-xl font-black text-slate-800">
                {form.precoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Investimento Total</p>
              <p className="text-xl font-black text-blue-600">
                {valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Quantidade */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Quantidade</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Hash size={18} />
              </div>
              <input
                type="text"
                value={formatQuantidadeDisplay()}
                onChange={handleQuantidadeChange}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none"
                disabled={form.precoAtual <= 0}
                required
                placeholder="0"
              />
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data da Compra</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Calendar size={18} />
              </div>
              <input
                type="date"
                value={form.dataInvestimento}
                onChange={(e) => setForm({ ...form, dataInvestimento: e.target.value })}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none"
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>
        </div>

        {/* Saldo info compact */}
        <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo após compra</span>
          <span className={`text-sm font-bold ${saldoDisponivel - valorTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>
            {(saldoDisponivel - valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Motivação */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Motivação (Opcional)</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <MessageSquare size={18} />
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none resize-none"
                placeholder="Por que este ativo?"
                rows={2}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha (6 dígitos)</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={senha}
                maxLength={6}
                onChange={(e) => setSenha(e.target.value)}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none text-center tracking-[0.5em]"
                placeholder="••••••"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <button
          type="submit"
          className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
          disabled={!form.nome.trim() || valorTotal <= 0 || getQuantidadeNumerica() <= 0 || form.precoAtual <= 0 || form.loadingPreco}
        >
          <Plus size={18} /> Adicionar Ativo
        </button>
      </div>
    </form>
  );
}