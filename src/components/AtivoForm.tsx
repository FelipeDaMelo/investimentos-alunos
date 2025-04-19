import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, CriptoAtivo, RendaFixaAtivo } from '../types/Ativo'; // Corrigido import

interface Props {
  onAddAtivo: (ativo: Ativo) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  tipoAtivo: 'rendaVariavel' | 'rendaFixa' | 'cripto';
}

const AtivoForm = ({ onAddAtivo, loading, setLoading, tipoAtivo }: Props) => {
  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: new Date().toISOString().split('T')[0],
  });

  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<RendaFixaAtivo['parametrosFixa']>({}); // Corrigido tipo
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const handleAddAtivo = async () => {
    setErro('');
    setSucesso('');

    if (new Date(novoAtivo.dataInvestimento) > new Date()) {
      setErro('Data não pode ser futura');
      return;
    }

    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      let valorAtual = 1; // Corrigido para number
      let patrimonioInicial = novoAtivo.valorInvestido;

      if (tipoAtivo === 'rendaVariavel' || tipoAtivo === 'cripto') {
        const valor = await fetchValorAtual(novoAtivo.nome);
        if (valor === 'Erro ao carregar') {
          setErro('Erro ao buscar o valor do ativo');
          return;
        }
        valorAtual = parseFloat(valor); // Convertendo para number
      }

      if (tipoAtivo === 'rendaVariavel') {
        const quantidade = Math.floor(novoAtivo.valorInvestido / valorAtual);
        if (quantidade < 1) {
          setErro('Não é possível comprar menos de 1 ação');
          return;
        }
        patrimonioInicial = quantidade * valorAtual;
      }

      const novoAtivoObj: Ativo = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual: valorAtual.toString(), // Mantido como string para compatibilidade
        patrimonioPorDia: {
          [hoje]: patrimonioInicial,
        },
        tipo: tipoAtivo,
      };

      if (tipoAtivo === 'rendaFixa') {
        (novoAtivoObj as RendaFixaAtivo).categoriaFixa = categoriaFixa;
        (novoAtivoObj as RendaFixaAtivo).parametrosFixa = parametrosFixa;
      }

      if (tipoAtivo === 'cripto') {
        const fracaoAdquirida = novoAtivo.valorInvestido / valorAtual;
        (novoAtivoObj as CriptoAtivo).fracaoAdquirida = fracaoAdquirida;
      }

      onAddAtivo(novoAtivoObj);
      setSucesso('Ativo adicionado com sucesso!');
      setNovoAtivo({
        nome: '',
        valorInvestido: 0,
        dataInvestimento: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      setErro('Erro ao adicionar ativo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleParametrosChange = (prev: RendaFixaAtivo['parametrosFixa'], updates: Partial<RendaFixaAtivo['parametrosFixa']>) => {
    return { ...prev, ...updates };
  };

  return (
    <div className="border p-4 rounded-lg mb-6">
      <h2 className="text-xl font-bold mb-4">Adicionar {tipoAtivo === 'rendaFixa' ? 'Renda Fixa' : tipoAtivo === 'rendaVariavel' ? 'Renda Variável' : 'Criptomoeda'}</h2>

      {tipoAtivo === 'rendaFixa' && (
        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1">Categoria:</label>
            <select
              value={categoriaFixa}
              onChange={(e) => {
                setCategoriaFixa(e.target.value as any);
                setParametrosFixa({});
              }}
              className="w-full p-2 border rounded"
            >
              <option value="prefixada">Prefixada</option>
              <option value="posFixada">Pós-fixada</option>
              <option value="hibrida">Híbrida</option>
            </select>
          </div>

          {categoriaFixa === 'prefixada' && (
            <div>
              <label className="block mb-1">Taxa Prefixada (% a.a):</label>
              <input
                type="number"
                placeholder="Ex: 10.5"
                onChange={(e) =>
                  setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })
                }
                className="w-full p-2 border rounded"
              />
            </div>
          )}

          {categoriaFixa === 'posFixada' && (
            <div>
              <label className="block mb-1">Índice:</label>
              <select
                onChange={(e) => {
                  const indicador = e.target.value;
                  const valor = parseFloat(prompt(`Informe o percentual de ${indicador} (%):`) || '0');
                  if (indicador === 'CDI') {
                    setParametrosFixa({ percentualSobreCDI: valor });
                  } else if (indicador === 'SELIC') {
                    setParametrosFixa({ percentualSobreSELIC: valor });
                  }
                }}
                className="w-full p-2 border rounded"
              >
                <option value="">Selecione o índice</option>
                <option value="CDI">% CDI</option>
                <option value="SELIC">% SELIC</option>
              </select>
            </div>
          )}

          {categoriaFixa === 'hibrida' && (
            <div className="space-y-2">
              <div>
                <label className="block mb-1">Taxa Prefixada (% a.a):</label>
                <input
                  type="number"
                  placeholder="Ex: 5.0"
                  onChange={(e) =>
                    setParametrosFixa((prev) => ({
                      ...prev,
                      taxaPrefixada: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1">IPCA estimado (% a.a):</label>
                <input
                  type="number"
                  placeholder="Ex: 3.5"
                  onChange={(e) =>
                    setParametrosFixa((prev) => ({
                      ...prev,
                      ipca: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block mb-1">Nome do Ativo:</label>
          <input
            type="text"
            placeholder="Ex: PETR4 ou BTC"
            value={novoAtivo.nome}
            onChange={(e) => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Valor Investido (R$):</label>
          <input
            type="number"
            placeholder="Ex: 1000"
            value={novoAtivo.valorInvestido || ''}
            onChange={(e) =>
              setNovoAtivo({ ...novoAtivo, valorInvestido: parseFloat(e.target.value) || 0 })
            }
            className="w-full p-2 border rounded"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1">Data do Investimento:</label>
          <input
            type="date"
            value={novoAtivo.dataInvestimento}
            onChange={(e) => setNovoAtivo({ ...novoAtivo, dataInvestimento: e.target.value })}
            className="w-full p-2 border rounded"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        {erro && <p className="text-red-500">{erro}</p>}
        {sucesso && <p className="text-green-500">{sucesso}</p>}

        <button
          onClick={handleAddAtivo}
          disabled={loading}
          className={`w-full py-2 px-4 rounded ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        >
          {loading ? 'Processando...' : 'Adicionar Ativo'}
        </button>
      </div>
    </div>
  );
};

export default AtivoForm;