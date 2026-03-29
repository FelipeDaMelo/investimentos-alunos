import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Plus, ExternalLink, Calendar, Wallet, Lock, MessageSquare, TrendingUp, Tag, Percent, Info } from 'lucide-react';
import { criarAtivoFixa } from '../../utils/ativoHelpers';
import { RendaFixaAtivo } from '../../types/Ativo';
import useMoneyInput from '../../hooks/useMoneyInput';
import fetchValorAtual from '../../fetchValorAtual';

interface RendaFixaStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaFixaAtivo, comentario: string) => void;
  saldoDisponivel: number;
}

export default function RendaFixaStep({ onBack, onSubmit, saldoDisponivel }: RendaFixaStepProps) {
  const {
    value: valorInvestido,
    displayValue,
    handleChange
  } = useMoneyInput(0);

  const [form, setForm] = useState({
    nome: '',
    dataInvestimento: new Date().toISOString().split('T')[0],
    categoriaFixa: 'prefixada' as 'prefixada' | 'posFixada' | 'hibrida',
    parametrosFixa: {
      taxaPrefixada: '' as number | '',
      percentualCDI: '' as number | '',
      percentualSELIC: '' as number | '',
      ipca: '' as number | '',
      cdiUsado: 0,
      selicUsado: 0,
      ipcaUsado: 0
    }
  });

  const [cdiAtual, setCdiAtual] = useState<number | null>(null);
  const [selicAtual, setSelicAtual] = useState<number | null>(null);
  const [IPCAAtual, setIPCAAtual] = useState<number | null>(null);
  const [carregandoTaxas, setCarregandoTaxas] = useState(false);
  const [erroTaxas, setErroTaxas] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [indiceHibrido, setIndiceHibrido] = useState<'CDI' | 'SELIC' | 'IPCA'>('IPCA');
  const [senha, setSenha] = useState('');
  const [indicePosFixado, setIndicePosFixado] = useState<'CDI' | 'SELIC'>('CDI');
  const [comentario, setComentario] = useState('');

  const carregarTaxas = async () => {
    try {
      setCarregandoTaxas(true);
      setErroTaxas(null);
      const { valor: cdi } = await fetchValorAtual('CDI');
      const { valor: selic } = await fetchValorAtual('SELIC');
      const { valor: ipca } = await fetchValorAtual('IPCA');
      
      if (cdi === 'Erro ao carregar' || selic === 'Erro ao carregar' || ipca === 'Erro ao carregar') {
        throw new Error('Falha na sincronização com os indicadores');
      }

      setCdiAtual(parseFloat(cdi));
      setSelicAtual(parseFloat(selic));
      setIPCAAtual(parseFloat(ipca));
      const agora = new Date();
      setUltimaAtualizacao(`${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Erro ao buscar taxas:', error);
      setErroTaxas('Não foi possível sincronizar as taxas atuais. Tente novamente.');
    } finally {
      setCarregandoTaxas(false);
    }
  };

  useEffect(() => {
    if (form.categoriaFixa === 'posFixada' || form.categoriaFixa === 'hibrida') {
      carregarTaxas();
    }
  }, [form.categoriaFixa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorInvestido > saldoDisponivel) {
      alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`);
      return;
    }

    const parametrosNumericos = {
      taxaPrefixada: Number(form.parametrosFixa.taxaPrefixada) || 0,
      percentualCDI: Number(form.parametrosFixa.percentualCDI) || 0,
      percentualSELIC: Number(form.parametrosFixa.percentualSELIC) || 0,
      ipca: Number(form.parametrosFixa.ipca) || 0,
      cdiUsado: cdiAtual ?? 0,
      selicUsado: selicAtual ?? 0,
      ipcaUsado: IPCAAtual ?? 0,
    };

    const ativo = criarAtivoFixa({ ...form, valorInvestido, parametrosFixa: parametrosNumericos });
    onSubmit({ ...ativo, senha } as any, comentario);
  };

  const handleNumericInputChange = (field: keyof typeof form.parametrosFixa) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm(prev => ({ ...prev, parametrosFixa: { ...prev.parametrosFixa, [field]: value === '' ? '' : parseFloat(value) } }));
  };

  const handlePosFixadoPercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
    setForm(prev => ({
      ...prev,
      parametrosFixa: {
        ...prev.parametrosFixa,
        percentualCDI: indicePosFixado === 'CDI' ? val : prev.parametrosFixa.percentualCDI,
        percentualSELIC: indicePosFixado === 'SELIC' ? val : prev.parametrosFixa.percentualSELIC,
      }
    }));
  };

  const handleHibridoPercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? '' : parseFloat(e.target.value);
    setForm(prev => ({
      ...prev,
      parametrosFixa: {
        ...prev.parametrosFixa,
        percentualCDI: indiceHibrido === 'CDI' ? val : prev.parametrosFixa.percentualCDI,
        percentualSELIC: indiceHibrido === 'SELIC' ? val : prev.parametrosFixa.percentualSELIC,
        ipca: indiceHibrido === 'IPCA' ? val : prev.parametrosFixa.ipca,
      }
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-slate-800">Renda Fixa</h2>
        <p className="text-slate-500 text-sm font-medium">Preencha os dados da sua aplicação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Identificação e Valor */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome do Ativo</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Tag size={18} />
              </div>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none"
                placeholder="CDB Banco ABC"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Valor Investido</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100 border-r-2 border-slate-100 text-slate-500 font-black text-sm group-focus-within:bg-blue-50 group-focus-within:text-blue-600 transition-colors">R$</div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={displayValue}
                  onChange={handleChange}
                  className="w-full bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none"
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <Wallet className="text-slate-300 group-focus-within:text-blue-400 transition-colors" size={18} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Data e Categoria Lado a Lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Data da Aplicação</label>
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

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de Rentabilidade</label>
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <TrendingUp size={18} />
              </div>
              <select
                value={form.categoriaFixa}
                onChange={(e) => setForm({ ...form, categoriaFixa: e.target.value as any })}
                className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                required
              >
                <option value="prefixada">Pré-fixada (Taxa Fixa %)</option>
                <option value="posFixada">Pós-fixada (% do CDI/SELIC)</option>
                <option value="hibrida">Híbrida (IPCA + % Fixa)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Blue Box Taxas Específicas */}
      {/* Market Intelligence Dashboard */}
      {(form.categoriaFixa === 'posFixada' || form.categoriaFixa === 'hibrida') && (
        <div className="bg-slate-50/80 rounded-[1.5rem] p-4 border-2 border-slate-100 shadow-sm animate-fade-in mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                <TrendingUp size={14} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Indicadores Econômicos</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6">
                {[
                  { label: 'CDI', value: cdiAtual, color: 'text-emerald-500' },
                  { label: 'SELIC', value: selicAtual, color: 'text-blue-500' },
                  { label: 'IPCA', value: IPCAAtual, color: 'text-orange-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline gap-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-sm font-black ${item.color} tracking-tighter`}>
                      {item.value !== null ? `${item.value.toFixed(2)}%` : '---'}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="h-4 w-px bg-slate-200" />

              <button
                type="button"
                onClick={carregarTaxas}
                disabled={carregandoTaxas}
                className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-all group"
              >
                <RefreshCw size={12} className={`${carregandoTaxas ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Atualizar</span>
              </button>
            </div>
          </div>

          {erroTaxas && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm shrink-0">
                <Info size={14} />
              </div>
              <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight leading-tight">
                {erroTaxas}
              </p>
            </div>
          )}

          <div className="space-y-4 relative z-10">
            {form.categoriaFixa === 'posFixada' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Índice de Referência</label>
                  <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-white">
                    <div className="w-14 shrink-0 flex items-center justify-center border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                      <TrendingUp size={18} />
                    </div>
                    <select
                      value={indicePosFixado}
                      onChange={(e) => setIndicePosFixado(e.target.value as any)}
                      className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="CDI">% do CDI</option>
                      <option value="SELIC">% da SELIC</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rentabilidade (%)</label>
                  <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-white">
                    <div className="w-14 shrink-0 flex items-center justify-center border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                      <Percent size={18} />
                    </div>
                    <input
                      type="number"
                      value={indicePosFixado === 'CDI' ? form.parametrosFixa.percentualCDI : form.parametrosFixa.percentualSELIC}
                      onChange={handlePosFixadoPercentualChange}
                      className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white transition-all outline-none"
                      placeholder="100"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.categoriaFixa === 'hibrida' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Índice</label>
                  <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-white">
                    <div className="w-14 shrink-0 flex items-center justify-center border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                      <TrendingUp size={18} />
                    </div>
                    <select
                      value={indiceHibrido}
                      onChange={(e) => setIndiceHibrido(e.target.value as any)}
                      className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-slate-700 transition-all outline-none appearance-none cursor-pointer"
                    >
                      <option value="IPCA">IPCA</option>
                      <option value="CDI">CDI</option>
                      <option value="SELIC">SELIC</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa Fixa + (%)</label>
                  <div className="flex border-2 border-slate-200 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-white">
                    <div className="w-14 shrink-0 flex items-center justify-center border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                      <Percent size={18} />
                    </div>
                    <input
                      type="number"
                      value={form.parametrosFixa.taxaPrefixada}
                      onChange={handleNumericInputChange('taxaPrefixada')}
                      className="flex-1 bg-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white transition-all outline-none"
                      placeholder="6.0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {form.categoriaFixa === 'prefixada' && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Taxa Anual Fixa (%)</label>
          <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
            <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
              <Percent size={18} />
            </div>
            <input
              type="number"
              value={form.parametrosFixa.taxaPrefixada}
              onChange={handleNumericInputChange('taxaPrefixada')}
              className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-bold focus:bg-white transition-all outline-none"
              placeholder="12.5"
              step="0.01"
              required
            />
          </div>
        </div>
      )}

      {/* Resources & Help Panel (More Compact) */}
      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Info size={14} className="text-slate-400" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comparadores do Mercado</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'InfoMoney', url: 'https://www.infomoney.com.br/ferramentas/comparador-renda-fixa/' },
            { label: 'Tesouro Direto', url: 'https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm' },
            { label: 'Yubb', url: 'https://yubb.com.br/investimentos/renda-fixa' }
          ].map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-blue-600 transition-all">
              {link.label} <ExternalLink size={10} className="opacity-40" />
            </a>
          ))}
        </div>
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
              className="flex-1 bg-transparent px-5 py-3 text-slate-700 font-bold focus:bg-white transition-all outline-none resize-none"
              placeholder="Por que este ativo?"
              rows={1}
            />
          </div>
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Senha (6 dígitos)</label>
          <div className="relative group">
            <div className="flex border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
              <div className="w-14 shrink-0 flex items-center justify-center bg-slate-100/50 border-r-2 border-slate-100 text-slate-400 group-focus-within:bg-blue-50 group-focus-within:text-blue-500 transition-colors">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={senha}
                maxLength={6}
                onChange={(e) => setSenha(e.target.value)}
                className="flex-1 bg-transparent px-5 py-3 text-slate-700 font-bold focus:bg-white transition-all outline-none text-center tracking-[0.5em]"
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
          disabled={!form.nome.trim() || valorInvestido <= 0}
        >
          <Plus size={18} /> Adicionar Ativo
        </button>
      </div>
    </form>
  );
}