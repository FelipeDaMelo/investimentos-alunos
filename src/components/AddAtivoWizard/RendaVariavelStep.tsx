import { useState } from 'react';
import { criarAtivoVariavel } from '../../utils/ativoHelpers';
import { RendaVariavelAtivo } from '../../types/Ativo';

interface RendaVariavelStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaVariavelAtivo) => void;
  saldoDisponivel: number;
}

export default function RendaVariavelStep({ onBack, onSubmit, saldoDisponivel }: RendaVariavelStepProps) {
  const [form, setForm] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: new Date().toISOString().split('T')[0],
    subtipo: 'acao' as const,
    quantidade: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(criarAtivoVariavel({
      ...form,
      tickerFormatado: form.nome.toUpperCase()
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 font-medium text-gray-700">Tipo</label>
        <select
          value={form.subtipo}
          onChange={(e) => setForm({
            ...form,
            subtipo: e.target.value as 'acao' | 'fii' | 'criptomoeda'
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
        </label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({...form, nome: e.target.value})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          placeholder={
            form.subtipo === 'acao' ? 'Ex: PETR4' :
            form.subtipo === 'fii' ? 'Ex: MXRF11' : 'Ex: BTC'
          }
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Valor Investido (R$)</label>
        <input
          type="number"
          value={form.valorInvestido || ''}
          onChange={(e) => setForm({...form, valorInvestido: Number(e.target.value)})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          min="0.01"
          step="0.01"
          max={saldoDisponivel}
          required
        />
        <p className="mt-1 text-sm text-gray-600">
          Saldo disponível: <span className="font-semibold">R$ {saldoDisponivel.toFixed(2)}</span>
        </p>
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Quantidade</label>
        <input
          type="number"
          value={form.quantidade || ''}
          onChange={(e) => setForm({...form, quantidade: Number(e.target.value)})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          min="0.00000001"
          step="0.00000001"
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Data da Compra</label>
        <input
          type="date"
          value={form.dataInvestimento}
          onChange={(e) => setForm({...form, dataInvestimento: e.target.value})}
          className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
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
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          disabled={!form.nome || form.valorInvestido <= 0 || form.quantidade <= 0}
        >
          Adicionar Ativo
        </button>
      </div>
    </form>
  );
}