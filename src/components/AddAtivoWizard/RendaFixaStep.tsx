import React, { useState, useEffect } from 'react';
import { criarAtivoFixa } from '../../utils/ativoHelpers';
import { RendaFixaAtivo } from '../../types/Ativo';
import useMoneyInput from '../../hooks/useMoneyInput';
import fetchValorAtual from '../../fetchValorAtual';
import Button from '../Button';

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

  // AJUSTE 1: Estado inicial modificado para permitir strings vazias nos campos numéricos
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
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('');
  const [indiceHibrido, setIndiceHibrido] = useState<'CDI' | 'SELIC' | 'IPCA'>('IPCA');
  const [senha, setSenha] = useState('');
  const [indicePosFixado, setIndicePosFixado] = useState<'CDI' | 'SELIC'>('CDI');
  const [comentario, setComentario] = useState(''); // ADICIONE ESTE ESTADO

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
    if (form.categoriaFixa === 'posFixada' || form.categoriaFixa === 'hibrida') {
      carregarTaxas();
    }
  }, [form.categoriaFixa]);

  // AJUSTE 2: Garantir que os valores sejam números antes de enviar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (valorInvestido > saldoDisponivel) {
      alert(`Valor excede o saldo disponível (${saldoDisponivel.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})})`);
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

    const ativo = criarAtivoFixa({
      ...form,
      valorInvestido,
      parametrosFixa: parametrosNumericos,
    });

    onSubmit({ ...ativo, senha } as any, comentario);
  };

  // AJUSTE 3: Funções centralizadas para lidar com inputs numéricos que podem ficar vazios
  const handleNumericInputChange = (field: keyof typeof form.parametrosFixa) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      parametrosFixa: {
        ...prevForm.parametrosFixa,
        [field]: value === '' ? '' : parseFloat(value)
      }
    }));
  };

  const handlePosFixadoPercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const valorFinal = value === '' ? '' : parseFloat(value);
    setForm(prevForm => ({
      ...prevForm,
      parametrosFixa: {
        ...prevForm.parametrosFixa,
        percentualCDI: indicePosFixado === 'CDI' ? valorFinal : prevForm.parametrosFixa.percentualCDI,
        percentualSELIC: indicePosFixado === 'SELIC' ? valorFinal : prevForm.parametrosFixa.percentualSELIC,
      }
    }));
  };

  const handleHibridoPercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const valorFinal = value === '' ? '' : parseFloat(value);
    setForm(prevForm => ({
      ...prevForm,
      parametrosFixa: {
        ...prevForm.parametrosFixa,
        percentualCDI: indiceHibrido === 'CDI' ? valorFinal : prevForm.parametrosFixa.percentualCDI,
        percentualSELIC: indiceHibrido === 'SELIC' ? valorFinal : prevForm.parametrosFixa.percentualSELIC,
        ipca: indiceHibrido === 'IPCA' ? valorFinal : prevForm.parametrosFixa.ipca,
      }
    }));
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
          placeholder="Ex:1000,00"
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
             <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-sm text-gray-800">
          <p className="mb-2 font-semibold">Veja as opções reais de investimentos em renda fixa:</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>
              <a href="https://www.infomoney.com.br/ferramentas/comparador-renda-fixa/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                Comparador InfoMoney
              </a>
            </li>
            <li>
              <a href="https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                Tesouro Direto – Preços e Taxas
              </a>
            </li>
            <li>
              <a href="https://yubb.com.br/investimentos/renda-fixa" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                Yubb – Buscador de CDBs
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* 🔵 Taxas e botão quando for Pós-fixada */}
      {form.categoriaFixa === 'posFixada' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-4 text-sm text-gray-700">
          <div>
            <p>CDI Atual: {cdiAtual !== null ? `${cdiAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            <p>SELIC Atual: {selicAtual !== null ? `${selicAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            {ultimaAtualizacao && (
              <p className="text-gray-500 text-xs">Atualizado às {ultimaAtualizacao}</p>
            )}
          </div>

          <Button type="button" onClick={carregarTaxas} disabled={carregandoTaxas}>
            {carregandoTaxas ? 'Atualizando...' : 'Atualizar CDI/SELIC'}
          </Button>
        
          <div>
            <label className="block mb-1 font-medium">Índice de Referência</label>
            <select
              value={indicePosFixado}
              onChange={(e) => {
                const novoIndice = e.target.value as 'CDI' | 'SELIC';
                setIndicePosFixado(novoIndice);
                setForm(prevForm => ({
                  ...prevForm,
                  parametrosFixa: {
                    ...prevForm.parametrosFixa,
                    percentualCDI: novoIndice === 'CDI' ? (prevForm.parametrosFixa.percentualCDI || 100) : '',
                    percentualSELIC: novoIndice === 'SELIC' ? (prevForm.parametrosFixa.percentualSELIC || 100) : '',
                  }
                }));
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
              placeholder="Ex: 100"
              value={indicePosFixado === 'CDI' ? form.parametrosFixa.percentualCDI : form.parametrosFixa.percentualSELIC}
              onChange={handlePosFixadoPercentualChange}
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
            placeholder="Ex: 12.4"
            value={form.parametrosFixa.taxaPrefixada}
            onChange={handleNumericInputChange('taxaPrefixada')}
            className="w-full p-3 border-2 border-gray-300 rounded-lg"
            step="0.01"
            required
          />
        </div>
      )}

      {form.categoriaFixa === 'hibrida' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-4 text-sm text-gray-700">
          <div>
            <p>CDI Atual: {cdiAtual !== null ? `${cdiAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            <p>SELIC Atual: {selicAtual !== null ? `${selicAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            <p>IPCA Atual: {IPCAAtual !== null ? `${IPCAAtual.toFixed(4)}% a.d.` : 'Carregando...'}</p>
            {ultimaAtualizacao && (
              <p className="text-gray-500 text-xs">Atualizado às {ultimaAtualizacao}</p>
            )}
          </div>

          <Button type="button" onClick={carregarTaxas} disabled={carregandoTaxas}>
            {carregandoTaxas ? 'Atualizando...' : 'Atualizar Índices'}
          </Button>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Parte Prefixada (%)</label>
            <input
              type="number"
              placeholder="Ex: 7.14"
              value={form.parametrosFixa.taxaPrefixada}
              onChange={handleNumericInputChange('taxaPrefixada')}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">Índice Variável</label>
            <select
              value={indiceHibrido}
              onChange={(e) => {
                const novoIndice = e.target.value as 'CDI' | 'SELIC' | 'IPCA';
                setIndiceHibrido(novoIndice);
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
              placeholder="Ex: 100"
              value={
                indiceHibrido === 'CDI'
                  ? form.parametrosFixa.percentualCDI
                  : indiceHibrido === 'SELIC'
                  ? form.parametrosFixa.percentualSELIC
                  : form.parametrosFixa.ipca
              }
              onChange={handleHibridoPercentualChange}
              className="w-full p-3 border-2 border-gray-300 rounded-lg"
              step="0.01"
              required
            />
          </div>
        </div>
      )}

        <div>
        <label className="block mb-2 font-medium text-gray-700">Comentário sobre a movimentação (Opcional)</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
          placeholder="Explique o motivo da sua movimentação"
          rows={2}
        />
      </div>

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