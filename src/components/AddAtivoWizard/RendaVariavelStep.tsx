//src/components/AddAtivoWizard/RendaVariavelStep.tsx
import React, { useState, useEffect } from 'react';
import { criarAtivoVariavel } from '../../utils/ativoHelpers';
import { RendaVariavelAtivo } from '../../types/Ativo';
import fetchValorAtual from '../../fetchValorAtual';


type RendaVariavelAtivoCompleto = RendaVariavelAtivo & {
  precoMedio: number;
};

const Spinner = ({ className = "" }: { className?: string }) => (
  <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${className}`} />
);

interface RendaVariavelStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaVariavelAtivo) => void;
  saldoDisponivel: number;
}

export default function RendaVariavelStep({ onBack, onSubmit, saldoDisponivel }: RendaVariavelStepProps) {
  const [form, setForm] = useState({
    nome: '',
    dataInvestimento: new Date().toISOString().split('T')[0],
    subtipo: 'acao' as 'acao' | 'fii' | 'criptomoeda' | 'acao_internacional',
    quantidade: '', // Now always stored as string
    precoAtual: 0,
    loadingPreco: false,
    errorPreco: ''
  });

  // Helper function to safely convert quantidade to number
  const getQuantidadeNumerica = (): number => {
    if (form.quantidade === '') return 0;
    const value = form.quantidade.replace(',', '.');
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const valorTotal = getQuantidadeNumerica() * form.precoAtual;

  useEffect(() => {
    const buscarPrecoComDebounce = setTimeout(() => {
      if (form.nome.trim().length >= 2) {
        buscarPreco();
      }
    }, 800);

    return () => clearTimeout(buscarPrecoComDebounce);
  }, [form.nome, form.subtipo]);

  const buscarPreco = async () => {
    try {
      setForm(prev => ({...prev, loadingPreco: true, errorPreco: ''}));
      
      const tickerFormatado = formatarTicker(form.nome, form.subtipo);
      const precoString = await fetchValorAtual(tickerFormatado);
      
      if (precoString === 'Erro ao carregar') {
        throw new Error('Não foi possível obter o preço');
      }

      const preco = parseFloat(precoString);
      
      setForm(prev => ({
        ...prev, 
        precoAtual: preco, 
        loadingPreco: false,
        nome: formatarTickerParaExibicao(prev.nome, prev.subtipo)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setForm(prev => ({...prev, 
        loadingPreco: false, 
        errorPreco: errorMessage
      }));
    }
  };

  const formatarTicker = (ticker: string, tipo: string) => {
    const tickerLimpo = ticker.toUpperCase().trim();
    
    if (tipo === 'criptomoeda') {
      return tickerLimpo.includes('-') ? tickerLimpo : `${tickerLimpo}-USD`;
    }
    
    if (tipo === 'acao_internacional') {
      return tickerLimpo;
    }
    
    return tickerLimpo.endsWith('.SA') ? tickerLimpo : `${tickerLimpo}.SA`;
  };

  const formatarTickerParaExibicao = (ticker: string, tipo: string) => {
    if (tipo === 'criptomoeda') {
      return ticker.replace('-USD', '');
    }
    return ticker.replace('.SA', '');
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Validate input based on asset type
    if (form.subtipo === 'criptomoeda') {
      // Allow decimals for cryptocurrencies
      if (/^[0-9]*[,.]?[0-9]*$/.test(rawValue)) {
        setForm(prev => ({ ...prev, quantidade: rawValue }));
      }
    } else {
      // Only allow whole numbers for other asset types
      if (/^[0-9]*$/.test(rawValue)) {
        setForm(prev => ({ ...prev, quantidade: rawValue }));
      }
    }
  };

  const formatQuantidadeDisplay = () => {
    if (form.quantidade === '') return '';
    
    // For crypto, show as entered (with decimal separator)
    if (form.subtipo === 'criptomoeda') {
      return form.quantidade;
    }
    
    // For other types, format as integer
    const num = getQuantidadeNumerica();
    return num === 0 ? '' : Math.floor(num).toString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantidadeNumerica = getQuantidadeNumerica();
    
    // Validate quantidade
    if (quantidadeNumerica <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    // Validate for non-crypto assets
    if (form.subtipo !== 'criptomoeda' && !Number.isInteger(quantidadeNumerica)) {
      alert('Para este tipo de ativo, a quantidade deve ser um número inteiro');
      return;
    }

    if (valorTotal > saldoDisponivel) {
      alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`);
      return;
    }
    
    const ativoCompleto = {
      ...form,
      quantidade: quantidadeNumerica,
      valorInvestido: valorTotal,
      tickerFormatado: formatarTicker(form.nome, form.subtipo),
      precoMedio: form.precoAtual,
      tipo: 'rendaVariavel',
      valorAtual: valorTotal,
      patrimonioPorDia: {},
      id: Date.now().toString(),
      dataAdicao: new Date().toISOString()  // Adicionando propriedade faltante
    };

    onSubmit(criarAtivoVariavel(ativoCompleto as RendaVariavelAtivoCompleto));
  };

  const exemplosTicker = {
    acao: ['PETR4', 'VALE3', 'ITUB4'],
    fii: ['MXRF11', 'HGLG11', 'KNRI11'],
    criptomoeda: ['BTC', 'ETH', 'SOL'],
    acao_internacional: ['AAPL', 'GOOGL', 'TSLA']
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 font-medium text-gray-700">Tipo</label>
        <select
          value={form.subtipo}
          onChange={(e) => setForm({
            ...form,
            subtipo: e.target.value as 'acao' | 'fii' | 'criptomoeda' | 'acao_internacional',
            nome: '',
            precoAtual: 0,
            quantidade: ''
          })}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          required
        >
          <option value="acao">Ação Brasileira</option>
          <option value="acao_internacional">Ação Internacional</option>
          <option value="fii">FII</option>
          <option value="criptomoeda">Criptomoeda</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">
          {form.subtipo === 'acao' ? 'Código da Ação (Brasileira)' : 
           form.subtipo === 'acao_internacional' ? 'Código da Ação (Internacional)' :
           form.subtipo === 'fii' ? 'Código do FII' : 'Código da Criptomoeda'}
          <span className="ml-2 text-sm text-gray-500">
            Exemplos: {exemplosTicker[form.subtipo].join(', ')}
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({...form, nome: e.target.value})}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all pr-10"
            placeholder={`Digite o código (ex: ${exemplosTicker[form.subtipo][0]})`}
            required
          />
          {form.loadingPreco && (
            <div className="absolute right-3 top-3.5">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
        {form.errorPreco && (
          <p className="mt-1 text-sm text-red-600">{form.errorPreco}</p>
        )}
        {form.precoAtual > 0 && (
          <p className="mt-1 text-sm text-green-600">
            Preço atual: {form.precoAtual.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 font-medium text-gray-700">Quantidade</label>
          <input
            type="text"
            value={formatQuantidadeDisplay()}
            onChange={handleQuantidadeChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            inputMode={form.subtipo === 'criptomoeda' ? 'decimal' : 'numeric'}
            disabled={form.precoAtual <= 0}
            required
            placeholder={
              form.subtipo === 'criptomoeda' ? 'Ex: 0,01' : 
              'Ex: 10 (apenas números inteiros)'
            }
          />
          {form.subtipo === 'criptomoeda' && (
            <p className="mt-1 text-sm text-gray-500">Digite valores decimais (ex: 0,5 ou 1,25)</p>
          )}
          {(form.subtipo === 'acao' || form.subtipo === 'acao_internacional' || form.subtipo === 'fii') && (
            <p className="mt-1 text-sm text-gray-500">Apenas números inteiros positivos (ex: 1, 10, 100)</p>
          )}
        </div>
        
        <div>
          <label className="block mb-2 font-medium text-gray-700">Valor Total</label>
          <div className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-50">
            {valorTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Saldo disponível:</span>
          <span className="text-sm font-semibold">
            {saldoDisponivel.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Saldo após compra:</span>
          <span className={`text-sm font-semibold ${
            saldoDisponivel - valorTotal < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {(saldoDisponivel - valorTotal).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
          </span>
        </div>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Data da Compra</label>
        <input
          type="date"
          value={form.dataInvestimento}
          onChange={(e) => setForm({...form, dataInvestimento: e.target.value})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={
            !form.nome.trim() || 
            valorTotal <= 0 || 
            getQuantidadeNumerica() <= 0 || 
            form.precoAtual <= 0 ||
            form.loadingPreco
          }
        >
          Adicionar Ativo
        </button>
      </div>
    </form>
  );
}