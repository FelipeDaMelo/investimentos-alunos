import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';

interface Props {
  onAddAtivo: (ativo: Ativo) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  tipoAtivo: 'rendaVariavel' | 'rendaFixa';
  subtipo?: 'acao' | 'fii' | 'cripto';
}

const AtivoForm = ({ onAddAtivo, loading, setLoading, tipoAtivo, subtipo }: Props) => {
  const [formData, setFormData] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: new Date().toISOString().split('T')[0],
  });

  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<RendaFixaAtivo['parametrosFixa']>({});
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const formatarTicker = (ticker: string) => {
    let tickerFormatado = ticker.trim().toUpperCase();
    
    if (subtipo === 'acao' && /^[A-Z]{4}\d$/.test(tickerFormatado)) {
      tickerFormatado += '.SA';
    } else if (subtipo === 'cripto' && !tickerFormatado.includes('-')) {
      tickerFormatado += '-USD';
    }
    
    return tickerFormatado;
  };

  const handleAddAtivo = async () => {
    setErro('');
    setSucesso('');

    // Validações...
    
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      let valorAtual = 1;
      let patrimonioInicial = formData.valorInvestido;
      let quantidade = 0;
      let tickerFormatado = formData.nome;

      if (tipoAtivo === 'rendaVariavel') {
        tickerFormatado = formatarTicker(formData.nome);
        const valor = await fetchValorAtual(tickerFormatado);
        valorAtual = parseFloat(valor);
        quantidade = Math.floor(patrimonioInicial / valorAtual);
        patrimonioInicial = quantidade * valorAtual;
      }

      const novoAtivo = tipoAtivo === 'rendaFixa' ? {
        id: uuidv4(),
        nome: formData.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: formData.dataInvestimento,
        valorAtual: patrimonioInicial,
        patrimonioPorDia: { [hoje]: patrimonioInicial },
        tipo: 'rendaFixa',
        categoriaFixa,
        parametrosFixa
      } : {
        id: uuidv4(),
        nome: formData.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: formData.dataInvestimento,
        valorAtual,
        patrimonioPorDia: { [hoje]: patrimonioInicial },
        tipo: 'rendaVariavel',
        subtipo: subtipo!,
        tickerFormatado,
        quantidade
      };

      onAddAtivo(novoAtivo);
      setSucesso(
        tipoAtivo === 'rendaFixa' ? 'Ativo de Renda Fixa adicionado!' :
        `Ativo de Renda Variável (${subtipo === 'cripto' ? 'Criptomoeda' : subtipo === 'fii' ? 'FII' : 'Ação'}) adicionado!`
      );

      setFormData(prev => ({ ...prev, nome: '', valorInvestido: 0 }));

    } catch (error) {
      setErro('Erro ao adicionar ativo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-lg mb-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {tipoAtivo === 'rendaFixa' ? 'Novo Ativo de Renda Fixa' : 'Novo Ativo de Renda Variável'}
        {subtipo && (
          <span className="text-sm font-normal ml-2">
            ({subtipo === 'acao' ? 'Ação' : subtipo === 'fii' ? 'FII' : 'Criptomoeda'})
          </span>
        )}
      </h2>

      {tipoAtivo === 'rendaFixa' && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Categoria:</label>
            <select
              value={categoriaFixa}
              onChange={(e) => setCategoriaFixa(e.target.value as any)}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="prefixada">Prefixada</option>
              <option value="posFixada">Pós-fixada (%CDI ou %SELIC)</option>
              <option value="hibrida">Híbrida (Pré + Pós-fixada)</option>
            </select>
          </div>

          {categoriaFixa === 'prefixada' && (
            <div>
              <label className="block mb-1 text-sm font-medium">Taxa Prefixada (% a.a):</label>
              <input
                type="number"
                step="0.01"
                onChange={(e) => setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          )}

          {categoriaFixa === 'posFixada' && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-sm font-medium">Índice de Referência:</label>
                <select
                  onChange={(e) => {
                    const valor = parseFloat(prompt(`Informe o percentual sobre ${e.target.value}:`) || '0');
                    setParametrosFixa(e.target.value === 'CDI' 
                      ? { percentualCDI: valor }
                      : { percentualSELIC: valor });
                  }}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Selecione...</option>
                  <option value="CDI">% CDI</option>
                  <option value="SELIC">% SELIC</option>
                </select>
              </div>
              {parametrosFixa.percentualCDI && (
                <p className="text-xs text-gray-500">Definido: {parametrosFixa.percentualCDI}% do CDI</p>
              )}
              {parametrosFixa.percentualSELIC && (
                <p className="text-xs text-gray-500">Definido: {parametrosFixa.percentualSELIC}% da SELIC</p>
              )}
            </div>
          )}

          {categoriaFixa === 'hibrida' && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-sm font-medium">Parte Prefixada (% a.a):</label>
                <input
                  type="number"
                  step="0.01"
                  onChange={(e) => setParametrosFixa(prev => ({
                    ...prev,
                    taxaPrefixada: parseFloat(e.target.value)
                  }))}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Parte Pós-fixada:</label>
                <select
                  onChange={(e) => {
                    const valor = parseFloat(prompt(`Informe o percentual sobre ${e.target.value}:`) || '0');
                    setParametrosFixa(prev => ({
                      ...prev,
                      ...(e.target.value === 'CDI' 
                        ? { percentualCDI: valor }
                        : { percentualSELIC: valor })
                    }));
                  }}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Selecione o índice...</option>
                  <option value="CDI">% CDI</option>
                  <option value="SELIC">% SELIC</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">IPCA (% a.a):</label>
                <input
                  type="number"
                  step="0.01"
                  onChange={(e) => setParametrosFixa(prev => ({
                    ...prev,
                    ipca: parseFloat(e.target.value)
                  }))}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block mb-1 text-sm font-medium">
            {tipoAtivo === 'rendaFixa' ? 'Nome do Ativo' : 
             subtipo === 'cripto' ? 'Código da Criptomoeda (ex: BTC)' :
             subtipo === 'fii' ? 'Código do FII (ex: MXRF11)' : 'Código da Ação (ex: PETR4)'}
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="w-full p-2 border rounded text-sm"
            placeholder={
              tipoAtivo === 'rendaFixa' ? 'CDB Banco XYZ' : 
              subtipo === 'cripto' ? 'BTC, ETH, etc' :
              subtipo === 'fii' ? 'MXRF11, HGLG11, etc' : 'PETR4, VALE3, etc'
            }
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Valor Investido (R$)</label>
          <input
            type="number"
            value={formData.valorInvestido || ''}
            onChange={(e) => setFormData({...formData, valorInvestido: parseFloat(e.target.value) || 0})}
            className="w-full p-2 border rounded text-sm"
            min="0.01"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium">Data da Aplicação</label>
          <input
            type="date"
            value={formData.dataInvestimento}
            onChange={(e) => setFormData({...formData, dataInvestimento: e.target.value})}
            className="w-full p-2 border rounded text-sm"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {erro && <p className="mt-3 text-red-500 text-sm">{erro}</p>}
      {sucesso && <p className="mt-3 text-green-500 text-sm">{sucesso}</p>}

      <button
        onClick={handleAddAtivo}
        disabled={loading}
        className={`mt-4 w-full py-2 px-4 rounded text-sm font-medium ${
          loading ? 'bg-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processando...' : 'Adicionar Ativo'}
      </button>
    </div>
  );
};

export default AtivoForm;