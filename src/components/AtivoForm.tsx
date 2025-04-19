import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, CriptoAtivo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';

interface Props {
  onAddAtivo: (ativo: Ativo) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  tipoAtivo: 'rendaVariavel' | 'rendaFixa' | 'cripto';
}

const formatarTicker = (ticker: string, tipo: string) => {
  let tickerFormatado = ticker.trim().toUpperCase();

  if (tipo === 'rendaVariavel' && /^[A-Z]{4}\d$/.test(tickerFormatado)) {
    tickerFormatado += '.SA';
  } else if (tipo === 'cripto' && !tickerFormatado.includes('-')) {
    tickerFormatado += '-USD';
  }

  return tickerFormatado;
};

const AtivoForm = ({ onAddAtivo, loading, setLoading, tipoAtivo }: Props) => {
  const [formData, setFormData] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: new Date().toISOString().split('T')[0],
  });

  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<RendaFixaAtivo['parametrosFixa']>({});
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleAddAtivo = async () => {
    setErro('');
    setSucesso('');

    if (!formData.nome.trim()) {
      setErro('Informe o código do ativo');
      return;
    }

    if (formData.valorInvestido <= 0) {
      setErro('Valor investido deve ser positivo');
      return;
    }

    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const tickerFormatado = formatarTicker(formData.nome, tipoAtivo);
      let valorAtual = 1;
      let patrimonioInicial = formData.valorInvestido;
      let quantidade = 0;
      let fracaoAdquirida = 0;

      if (tipoAtivo !== 'rendaFixa') {
        const valor = await fetchValorAtual(formData.nome);
        if (valor === 'Erro ao carregar') {
          setErro('Erro ao buscar cotação. Verifique o ticker.');
          return;
        }
        valorAtual = parseFloat(valor);

        if (tipoAtivo === 'rendaVariavel') {
          quantidade = Math.floor(patrimonioInicial / valorAtual);
          if (quantidade < 1) {
            setErro(`Valor insuficiente para 1 unidade de ${tickerFormatado}`);
            return;
          }
          patrimonioInicial = quantidade * valorAtual;
        } else {
          fracaoAdquirida = patrimonioInicial / valorAtual;
        }
      }

      const baseAtivo = {
        id: uuidv4(),
        nome: formData.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: formData.dataInvestimento,
        valorAtual,
        patrimonioPorDia: { [hoje]: patrimonioInicial },
      };

      let novoAtivoObj: Ativo;

      switch (tipoAtivo) {
        case 'rendaFixa':
          novoAtivoObj = {
            ...baseAtivo,
            tipo: 'rendaFixa',
            categoriaFixa,
            parametrosFixa,
          };
          break;

        case 'rendaVariavel':
          novoAtivoObj = {
            ...baseAtivo,
            tipo: 'rendaVariavel',
            tickerFormatado,
            quantidade,
          };
          break;

        case 'cripto':
          novoAtivoObj = {
            ...baseAtivo,
            tipo: 'cripto',
            tickerFormatado,
            fracaoAdquirida,
          };
          break;
      }

      onAddAtivo(novoAtivoObj);
      setSucesso(
        `${
          tipoAtivo === 'rendaFixa' ? 'Renda Fixa' : 
          tipoAtivo === 'rendaVariavel' ? 'Ação/FII' : 'Criptomoeda'
        } adicionada com sucesso!`
      );

      setFormData(prev => ({
        ...prev,
        nome: '',
        valorInvestido: 0,
      }));

    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded-lg mb-6 bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4 text-gray-800">
        {tipoAtivo === 'rendaFixa' ? 'Novo Ativo de Renda Fixa' : 
         tipoAtivo === 'rendaVariavel' ? 'Nova Ação/FII' : 'Nova Criptomoeda'}
      </h2>

      {tipoAtivo === 'rendaFixa' && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-sm font-medium">Categoria:</label>
            <select
              value={categoriaFixa}
              onChange={(e) => {
                setCategoriaFixa(e.target.value as any);
                setParametrosFixa({});
              }}
              className="w-full p-2 border rounded text-sm"
            >
              <option value="prefixada">Prefixada</option>
              <option value="posFixada">Pós-fixada</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </div>

          {/* Campos específicos para renda fixa */}
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

          {/* Outros campos de renda fixa... */}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block mb-1 text-sm font-medium">
            {tipoAtivo === 'rendaFixa' ? 'Nome do Ativo' : 
             tipoAtivo === 'rendaVariavel' ? 'Ticker (ex: PETR4 ou MXRF11)' : 'Código (ex: BTC)'}
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            className="w-full p-2 border rounded text-sm"
            placeholder={
              tipoAtivo === 'rendaFixa' ? 'CDB Banco XYZ' : 
              tipoAtivo === 'rendaVariavel' ? 'PETR4 ou MXRF11' : 'BTC ou ETH'
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