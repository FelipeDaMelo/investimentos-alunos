import React, { useState } from 'react';
import { criarAtivoFixa } from '../../utils/ativoHelpers';
import { RendaFixaAtivo } from '../../types/Ativo';
import useMoneyInput from '../../hooks/useMoneyInput';

interface RendaFixaStepProps {
  onBack: () => void;
  onSubmit: (ativo: RendaFixaAtivo) => void;
  saldoDisponivel: number;
}

export default function RendaFixaStep({ onBack, onSubmit, saldoDisponivel }: RendaFixaStepProps) {
  const { 
    value: valorInvestido, 
    displayValue, 
    handleChange
  } = useMoneyInput(0);

  const [erro, setErro] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: '',
    dataInvestimento: new Date().toISOString().split('T')[0],
    categoriaFixa: 'prefixada' as 'prefixada' | 'posFixada' | 'hibrida',
    parametrosFixa: {
      taxaPrefixada: 0,
      percentualCDI: 0,
      percentualSELIC: 0,
      ipca: 0
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (valorInvestido > saldoDisponivel) {
      setErro(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL'
      })})`);
      return;
    }

    setErro(null);
    onSubmit(criarAtivoFixa({
      ...form,
      valorInvestido
    }));
  };

  const handleParametroChange = (tipo: 'CDI' | 'SELIC') => {
    const valor = Math.max(0, parseFloat(prompt(`Informe o percentual sobre ${tipo}:`) || '0'));
    setForm({
      ...form,
      parametrosFixa: {
        ...form.parametrosFixa,
        ...(tipo === 'CDI'
          ? { percentualCDI: valor }
          : { percentualSELIC: valor })
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 font-medium text-gray-700">Nome do Ativo</label>
        <input
          type="text"
          value={form.nome}
          onChange={(e) => setForm({...form, nome: e.target.value})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          placeholder="Ex: CDB Banco XYZ"
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Valor Investido</label>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          required
        />
        <p className="mt-1 text-sm text-gray-600">
          Saldo disponível: {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(saldoDisponivel)}
        </p>
        {erro && <p className="text-red-600 text-sm mt-1">{erro}</p>}
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Data da Aplicação</label>
        <input
          type="date"
          value={form.dataInvestimento}
          onChange={(e) => setForm({...form, dataInvestimento: e.target.value})}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div>
        <label className="block mb-2 font-medium text-gray-700">Categoria</label>
        <select
          value={form.categoriaFixa}
          onChange={(e) => setForm({
            ...form,
            categoriaFixa: e.target.value as 'prefixada' | 'posFixada' | 'hibrida'
          })}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          required
        >
          <option value="prefixada">Pré-fixada</option>
          <option value="posFixada">Pós-fixada</option>
          <option value="hibrida">Híbrida</option>
        </select>
      </div>

      {form.categoriaFixa === 'prefixada' && (
        <div>
          <label className="block mb-2 font-medium text-gray-700">Taxa Anual (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.parametrosFixa.taxaPrefixada}
            onChange={(e) => setForm({
              ...form,
              parametrosFixa: {
                ...form.parametrosFixa,
                taxaPrefixada: Number(e.target.value)
              }
            })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            required
          />
        </div>
      )}

      {form.categoriaFixa === 'posFixada' && (
        <div>
          <label className="block mb-2 font-medium text-gray-700">Índice de Referência</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleParametroChange('CDI')}
              className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Editar % CDI ({form.parametrosFixa.percentualCDI}%)
            </button>
            <button
              type="button"
              onClick={() => handleParametroChange('SELIC')}
              className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Editar % SELIC ({form.parametrosFixa.percentualSELIC}%)
            </button>
          </div>
        </div>
      )}

      {form.categoriaFixa === 'hibrida' && (
        <>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Parte Prefixada (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.parametrosFixa.taxaPrefixada}
              onChange={(e) => setForm({
                ...form,
                parametrosFixa: {
                  ...form.parametrosFixa,
                  taxaPrefixada: Number(e.target.value)
                }
              })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">Parte Pós-fixada</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleParametroChange('CDI')}
                className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Editar % CDI ({form.parametrosFixa.percentualCDI}%)
              </button>
              <button
                type="button"
                onClick={() => handleParametroChange('SELIC')}
                className="flex-1 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Editar % SELIC ({form.parametrosFixa.percentualSELIC}%)
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-2 font-medium text-gray-700">IPCA (% a.a)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.parametrosFixa.ipca}
              onChange={(e) => setForm({
                ...form,
                parametrosFixa: {
                  ...form.parametrosFixa,
                  ipca: Number(e.target.value)
                }
              })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              placeholder="Ex: 3.2"
            />
          </div>
        </>
      )}

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
          disabled={!form.nome || valorInvestido <= 0}
        >
          Adicionar Ativo
        </button>
      </div>
    </form>
  );
}
