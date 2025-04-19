import { useState } from 'react';
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
    tickerFormatado: '',
    quantidade: 0
  });

  const handleSubmit = () => {
    onSubmit({
      ...form,
      tipo: 'rendaVariavel',
      valorAtual: form.valorInvestido / (form.quantidade || 1)
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Novo Ativo de Renda Variável</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Tipo</label>
          <select
            value={form.subtipo}
            onChange={(e) => setForm({...form, subtipo: e.target.value as any})}
            className="w-full p-2 border rounded"
          >
            <option value="acao">Ação</option>
            <option value="fii">FII</option>
            <option value="criptomoeda">Criptomoeda</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">
            {form.subtipo === 'acao' ? 'Código da Ação' : 
             form.subtipo === 'fii' ? 'Código do FII' : 'Código da Criptomoeda'}
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({...form, nome: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder={
              form.subtipo === 'acao' ? 'Ex: PETR4' :
              form.subtipo === 'fii' ? 'Ex: MXRF11' : 'Ex: BTC'
            }
          />
        </div>

        <div>
          <label className="block mb-1">Valor Investido (R$)</label>
          <input
            type="number"
            value={form.valorInvestido || ''}
            onChange={(e) => setForm({...form, valorInvestido: Number(e.target.value)})}
            className="w-full p-2 border rounded"
            min="0.01"
            step="0.01"
            max={saldoDisponivel}
          />
          <p className="text-sm text-gray-600 mt-1">
            Saldo disponível: R$ {saldoDisponivel.toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block mb-1">Data da Compra</label>
          <input
            type="date"
            value={form.dataInvestimento}
            onChange={(e) => setForm({...form, dataInvestimento: e.target.value})}
            className="w-full p-2 border rounded"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onBack}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Voltar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!form.nome || form.valorInvestido <= 0}
          >
            Adicionar Ativo
          </button>
        </div>
      </div>
    </div>
  );
}