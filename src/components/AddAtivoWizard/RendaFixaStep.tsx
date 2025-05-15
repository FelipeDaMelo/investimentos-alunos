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

    onSubmit(criarAtivoFixa({
      ...form,
      valorInvestido
    }));
  };

  const handleParametroChange = (tipo: 'CDI' | 'SELIC') => {
    const valor = parseFloat(prompt(`Informe o percentual sobre ${tipo}:`) || '0');
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
      {form.categoriaFixa === 'posFixada' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm text-gray-700">
        <div>
          <p>CDI Atual: {cdiAtual !== null ? `${cdiAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
          <p>SELIC Atual: {selicAtual !== null ? `${selicAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
          <p>IPCA Atual: {IPCAAtual !== null ? `${IPCAAtual.toFixed(4)}% a.m.` : 'Carregando...'}</p>
          {ultimaAtualizacao && (
            <p className="text-gray-500 text-xs">Atualizado às {ultimaAtualizacao}</p>
          )}
        </div>
        <Button
  type="button"
  onClick={carregarTaxas}
  disabled={carregandoTaxas}
>
  {carregandoTaxas ? 'Atualizando...' : 'Atualizar CDI/SELIC'}
</Button>
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

      {/* 🔵 Taxas e botão quando for Pós-fixada */}
      {form.categoriaFixa === 'hibrida' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm text-gray-700">
          <div>
            <p>CDI Atual: {cdiAtual !== null ? `${cdiAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            <p>SELIC Atual: {selicAtual !== null ? `${selicAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            <p>IPCA Atual: {IPCAAtual !== null ? `${IPCAAtual.toFixed(4)}% a.m.` : 'Carregando...'}</p>
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
        value={
          form.parametrosFixa.percentualCDI > 0
            ? 'CDI'
            : form.parametrosFixa.percentualSELIC > 0
            ? 'SELIC'
            : 'IPCA'
        }
        onChange={(e) => {
          const indice = e.target.value as 'CDI' | 'SELIC' | 'IPCA';
          setForm({
            ...form,
            parametrosFixa: {
              ...form.parametrosFixa,
              percentualCDI: indice === 'CDI' ? form.parametrosFixa.percentualCDI || 100 : 0,
              percentualSELIC: indice === 'SELIC' ? form.parametrosFixa.percentualSELIC || 100 : 0,
              ipca: indice === 'IPCA' ? form.parametrosFixa.ipca || 100 : 0,
            },
          });
        }}
        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
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
          form.parametrosFixa.percentualCDI > 0
            ? form.parametrosFixa.percentualCDI
            : form.parametrosFixa.percentualSELIC > 0
            ? form.parametrosFixa.percentualSELIC
            : form.parametrosFixa.ipca
        }
        onChange={(e) => {
          const valor = Number(e.target.value);
          const indice =
            form.parametrosFixa.percentualCDI > 0
              ? 'CDI'
              : form.parametrosFixa.percentualSELIC > 0
              ? 'SELIC'
              : 'IPCA';

          setForm({
            ...form,
            parametrosFixa: {
              ...form.parametrosFixa,
              percentualCDI: indice === 'CDI' ? valor : 0,
              percentualSELIC: indice === 'SELIC' ? valor : 0,
              ipca: indice === 'IPCA' ? valor : 0,
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

{/* Botões */}
<div className="flex justify-between pt-4">
  <Button
    type="button"
    variant="secondary"
    onClick={onBack}
  >
    Voltar
  </Button>

  <Button
    type="submit"
    disabled={!form.nome || valorInvestido <= 0}
  >
    Adicionar Ativo
  </Button>
</div>
    </form>
  );
}
