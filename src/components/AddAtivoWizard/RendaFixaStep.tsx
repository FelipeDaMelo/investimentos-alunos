import React, { useState, useEffect } from 'react';
import { criarAtivoFixa } from '../../utils/ativoHelpers';
import { RendaFixaAtivo } from '../../types/Ativo';
import useMoneyInput from '../../hooks/useMoneyInput';
import fetchValorAtual from '../../fetchValorAtual';
import Button from '../Button';

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

  const [cdiAtual, setCdiAtual] = useState<number | null>(null);
  const [selicAtual, setSelicAtual] = useState<number | null>(null);
  const [IPCAAtual, setIPCAAtual] = useState<number | null>(null);
  const [carregandoTaxas, setCarregandoTaxas] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [indiceSelecionado, setIndiceSelecionado] = useState<'CDI' | 'SELIC' | 'IPCA'>('CDI');
  const [senha, setSenha] = useState('');

  const carregarTaxas = async () => {
    try {
      setCarregandoTaxas(true);
      const cdi = await fetchValorAtual('CDI');
      const selic = await fetchValorAtual('SELIC');
      const ipca = await fetchValorAtual('IPCA');
      setCdiAtual(parseFloat(cdi));
      setSelicAtual(parseFloat(selic));
      setIPCAAtual(parseFloat(ipca));
      const agora = new Date();
      const horas = agora.getHours().toString().padStart(2, '0');
      const minutos = agora.getMinutes().toString().padStart(2, '0');
      setUltimaAtualizacao(`${horas}:${minutos}`);
    } catch (error) {
      console.error('Erro ao buscar CDI/SELIC:', error);
    } finally {
      setCarregandoTaxas(false);
    }
  };

  useEffect(() => {
    if (form.categoriaFixa === 'posFixada') {
      carregarTaxas();
    }
  }, [form.categoriaFixa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (valorInvestido > saldoDisponivel) {
      alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`);
      return;
    }
const ativo = criarAtivoFixa({
  ...form,
  valorInvestido
});

onSubmit({
  ...ativo,
  senha // tipo precisa aceitar isso
} as any); // ou defina o tipo como RendaFixaAtivo & { senha: string }
  }

  return (
    <form 
    onSubmit={handleSubmit} 
  className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] px-2"
>

      {/* Nome do ativo */}
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

      {/* Valor Investido */}
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
      </div>

      {/* Data da Aplicação */}
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

      {/* Categoria */}
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

      {/* 🔵 Taxas e botão quando for Pós-fixada */}
{(form.categoriaFixa === 'posFixada' || form.categoriaFixa === 'hibrida') && (
  <div className="bg-blue-50 p-4 rounded-lg space-y-4 text-sm text-gray-700">
    <div>
      <p>CDI Atual: {cdiAtual !== null ? `${cdiAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
      <p>SELIC Atual: {selicAtual !== null ? `${selicAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
      {form.categoriaFixa === 'hibrida' && (
        <p>IPCA Atual: {IPCAAtual !== null ? `${IPCAAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
      )}
      {ultimaAtualizacao && (
        <p className="text-gray-500 text-xs">Atualizado às {ultimaAtualizacao}</p>
      )}
    </div>

    <Button
      type="button"
      onClick={carregarTaxas}
      disabled={carregandoTaxas}
    >
      {carregandoTaxas ? 'Atualizando...' : 'Atualizar CDI/SELIC/IPCA'}
    </Button>

    {/* 🔽 Novo bloco: escolha de índice e percentual */}
    <div>
      <label className="block mb-1 font-medium">Índice de Referência</label>
      <select
        value={
          form.parametrosFixa.percentualCDI > 0 ? 'CDI' : 'SELIC'
        }
        onChange={(e) => {
          const indice = e.target.value as 'CDI' | 'SELIC';
          setForm({
            ...form,
            parametrosFixa: {
              ...form.parametrosFixa,
              percentualCDI: indice === 'CDI' ? form.parametrosFixa.percentualCDI || 100 : 0,
              percentualSELIC: indice === 'SELIC' ? form.parametrosFixa.percentualSELIC || 100 : 0,
              ipca: 0
            }
          });
        }}
        className="w-full p-3 border-2 border-gray-300 rounded-lg"
      >
        <option value="CDI">CDI</option>
        <option value="SELIC">SELIC</option>
      </select>
    </div>

    <div>
      <label className="block mb-1 font-medium">Percentual (%)</label>
      <input
        type="number"
        value={
          form.parametrosFixa.percentualCDI > 0
            ? form.parametrosFixa.percentualCDI
            : form.parametrosFixa.percentualSELIC
        }
        onChange={(e) => {
          const valor = Number(e.target.value);
          const indice =
            form.parametrosFixa.percentualCDI > 0 ? 'CDI' : 'SELIC';

          setForm({
            ...form,
            parametrosFixa: {
              ...form.parametrosFixa,
              percentualCDI: indice === 'CDI' ? valor : 0,
              percentualSELIC: indice === 'SELIC' ? valor : 0
            }
          });
        }}
        step="0.01"
        className="w-full p-3 border-2 border-gray-300 rounded-lg"
      />
    </div>
  </div>
)}


      {/* Campos específicos por categoria */}
      {form.categoriaFixa === 'prefixada' && (
        <div>
          <label className="block mb-2 font-medium text-gray-700">Taxa Anual (%)</label>
          <input
            type="number"
            value={form.parametrosFixa.taxaPrefixada}
            onChange={(e) => setForm({
              ...form,
              parametrosFixa: {
                ...form.parametrosFixa,
                taxaPrefixada: Number(e.target.value)
              }
            })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
            step="0.01"
            required
          />
        </div>
      )}

      {form.categoriaFixa === 'hibrida' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-4 text-sm text-gray-700">
          <div>
            <label className="block mb-2 font-medium text-gray-700">Parte Prefixada (%)</label>
            <input
              type="number"
              value={form.parametrosFixa.taxaPrefixada}
              onChange={(e) =>
                setForm({
                  ...form,
                  parametrosFixa: {
                    ...form.parametrosFixa,
                    taxaPrefixada: Number(e.target.value),
                  },
                })
              }
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Índice Variável</label>
            <select
              value={indiceSelecionado}
              onChange={(e) => {
                const novoIndice = e.target.value as 'CDI' | 'SELIC' | 'IPCA';
                setIndiceSelecionado(novoIndice);
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
            >
              <option value="CDI">CDI</option>
              <option value="SELIC">SELIC</option>
              <option value="IPCA">IPCA</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Percentual sobre o índice selecionado</label>
            <input
              type="number"
              value={
                indiceSelecionado === 'CDI'
                  ? form.parametrosFixa.percentualCDI
                  : indiceSelecionado === 'SELIC'
                  ? form.parametrosFixa.percentualSELIC
                  : form.parametrosFixa.ipca
              }
              onChange={(e) => {
                const valor = Number(e.target.value);
                setForm({
                  ...form,
                  parametrosFixa: {
                    ...form.parametrosFixa,
                    percentualCDI: indiceSelecionado === 'CDI' ? valor : form.parametrosFixa.percentualCDI,
                    percentualSELIC: indiceSelecionado === 'SELIC' ? valor : form.parametrosFixa.percentualSELIC,
                    ipca: indiceSelecionado === 'IPCA' ? valor : form.parametrosFixa.ipca,
                  },
                });
              }}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
              step="0.01"
              required
            />
          </div>
        </div>
      )}

<div>
  <label className="block mb-2 font-medium text-gray-700">Senha (6 dígitos)</label>
  <input
    type="password"
    value={senha}
    maxLength={6}
    onChange={(e) => setSenha(e.target.value)}
    className="w-full p-3 border-2 border-gray-300 rounded-lg"
    placeholder="******"
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
            valorInvestido <= 0
          }
        >
          Adicionar Ativo
        </button>
      </div>
    </form>
  );
}