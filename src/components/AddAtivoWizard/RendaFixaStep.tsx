import { useState } from 'react';
import { RendaFixaAtivo } from '../../types/Ativo';

interface RendaFixaStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaFixaAtivo) => void;
  saldoDisponivel: number;
}

export default function RendaFixaStep({ onBack, onSubmit, saldoDisponivel }: RendaFixaStepProps) {
  const [form, setForm] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: new Date().toISOString().split('T')[0],
    categoriaFixa: 'prefixada' as const,
    parametrosFixa: {} as any
  });

  const handleSubmit = () => {
    onSubmit({
      ...form,
      tipo: 'rendaFixa',
      valorAtual: form.valorInvestido
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Novo Ativo de Renda Fixa</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block mb-1">Nome do Ativo</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => setForm({...form, nome: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Ex: CDB Banco XYZ"
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
          <label className="block mb-1">Data da Aplicação</label>
          <input
            type="date"
            value={form.dataInvestimento}
            onChange={(e) => setForm({...form, dataInvestimento: e.target.value})}
            className="w-full p-2 border rounded"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block mb-1">Categoria</label>
          <select
            value={form.categoriaFixa}
            onChange={(e) => setForm({...form, categoriaFixa: e.target.value as any})}
            className="w-full p-2 border rounded"
          >
            <option value="prefixada">Pré-fixada</option>
            <option value="posFixada">Pós-fixada</option>
            <option value="hibrida">Híbrida</option>
          </select>
        </div>

        {/* Adicione aqui os campos específicos para cada categoria */}

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