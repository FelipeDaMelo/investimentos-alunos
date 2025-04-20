import React, { useState, useEffect } from 'react';
import { criarAtivoVariavel } from '../../utils/ativoHelpers';
import { RendaVariavelAtivo } from '../../types/Ativo';
import useMoneyInput from '../../hooks/useMoneyInput';
import fetchValorAtual from '../../fetchValorAtual';
import { Spinner } from '../ui/Spinner';

interface RendaVariavelStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaVariavelAtivo) => void;
  saldoDisponivel: number;
}

export default function RendaVariavelStep({ onBack, onSubmit, saldoDisponivel }: RendaVariavelStepProps) {
  const [form, setForm] = useState({
    nome: '',
    dataInvestimento: new Date().toISOString().split('T')[0],
    subtipo: 'acao' as 'acao' | 'fii' | 'criptomoeda',
    quantidade: 0,
    precoAtual: 0,
    loadingPreco: false,
    errorPreco: ''
  });

  const { 
    value: valorTotal, 
    displayValue: displayValorTotal, 
    handleChange: handleValorTotalChange,
    setValue: setValorTotal
  } = useMoneyInput(0);

  // Busca o preço quando o ticker ou tipo muda
  useEffect(() => {
    const buscarPrecoComDebounce = setTimeout(() => {
      if (form.nome.trim().length >= 3) {
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
      
      if (form.quantidade > 0) {
        setValorTotal(form.quantidade * preco);
      }
    // Atualize o catch:
} catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    setForm(prev => ({...prev, 
      loadingPreco: false, 
      errorPreco: errorMessage
    }));
  }
  };

  // Formata o ticker para busca na API
  const formatarTicker = (ticker: string, tipo: string) => {
    const tickerLimpo = ticker.toUpperCase().trim();
    
    if (tipo === 'criptomoeda') {
      return tickerLimpo.includes('-') ? tickerLimpo : `${tickerLimpo}-USD`;
    }
    
    // Para ações/FIIs brasileiros (padrão .SA)
    return tickerLimpo.endsWith('.SA') ? tickerLimpo : `${tickerLimpo}.SA`;
  };

  // Formata o ticker para exibição (remove .SA para edição)
  const formatarTickerParaExibicao = (ticker: string, tipo: string) => {
    if (tipo === 'criptomoeda') {
      return ticker.replace('-USD', '');
    }
    return ticker.replace('.SA', '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (valorTotal > saldoDisponivel) {
      alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`);
      return;
    }

    onSubmit(criarAtivoVariavel({
      ...form,
      valorInvestido: valorTotal,
      tickerFormatado: formatarTicker(form.nome, form.subtipo),
      precoMedio: form.precoAtual
    }));
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantidade = Number(e.target.value);
    const valorCalculado = quantidade * form.precoAtual;
    
    setForm(prev => ({...prev, quantidade}));
    setValorTotal(valorCalculado);
  };

  const handleValorInvestidoChange = () => {
    if (form.precoAtual > 0) {
      const quantidadeCalculada = valorTotal / form.precoAtual;
      setForm(prev => ({...prev, quantidade: parseFloat(quantidadeCalculada.toFixed(8))}));
    }
  };

  const exemplosTicker = {
    acao: ['PETR4', 'VALE3', 'ITUB4'],
    fii: ['MXRF11', 'HGLG11', 'KNRI11'],
    criptomoeda: ['BTC', 'ETH', 'SOL']
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 font-medium text-gray-700">Tipo</label>
        <select
          value={form.subtipo}
          onChange={(e) => setForm({
            ...form,
            subtipo: e.target.value as 'acao' | 'fii' | 'criptomoeda',
            nome: '',
            precoAtual: 0
          })}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          required
        >
          <option value="acao">Ação</option>
          <option value="fii">FII</option>
          <option value="criptomoeda">Criptomoeda</option>
        </select>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">
          {form.subtipo === 'acao' ? 'Código da Ação' : 
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
              <Spinner size="small" />
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
            type="number"
            value={form.quantidade || ''}
            onChange={handleQuantidadeChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            min="0.00000001"
            step="0.00000001"
            disabled={form.precoAtual <= 0}
            required
          />
        </div>
        
        <div>
          <label className="block mb-2 font-medium text-gray-700">Valor Total</label>
          <input
            type="text"
            value={displayValorTotal}
            onChange={handleValorTotalChange}
            onBlur={handleValorInvestidoChange}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            required
          />
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
            form.quantidade <= 0 || 
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