// src/components/AtivoForm.tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';

interface Props {
  onAddAtivo: (ativo: any) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
}

const AtivoForm = ({ onAddAtivo, loading, setLoading }: Props) => {
  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: '',
  });
  const [tipoAtivo, setTipoAtivo] = useState<'rendaVariavel' | 'rendaFixa'>('rendaVariavel');
  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<any>({});

  const handleAddAtivo = async () => {
    setLoading(true);
    try {
      let valorAtual = tipoAtivo === 'rendaVariavel' ? await fetchValorAtual(novoAtivo.nome) : '1';
      if (valorAtual === 'Erro ao carregar') {
        const manual = prompt('Não foi possível encontrar o valor do ativo. Deseja inserir manualmente? (Ex: 23.45)');
        if (manual && !isNaN(parseFloat(manual))) {
          valorAtual = parseFloat(manual).toFixed(2);
        } else {
          alert('Valor inválido. Ativo não adicionado.');
          setLoading(false);
          return;
        }
      }
      const hoje = new Date().toISOString().split('T')[0];
      const patrimonioInicial = tipoAtivo === 'rendaVariavel'
        ? novoAtivo.valorInvestido * parseFloat(valorAtual)
        : novoAtivo.valorInvestido;

      const novoAtivoObj = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: novoAtivo.valorInvestido,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual: valorAtual,
        patrimonioPorDia: {
          [hoje]: patrimonioInicial,
        },
        tipo: tipoAtivo,
        categoriaFixa: tipoAtivo === 'rendaFixa' ? categoriaFixa : undefined,
        parametrosFixa: tipoAtivo === 'rendaFixa' ? parametrosFixa : undefined,
      };
      onAddAtivo(novoAtivoObj);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
    } finally {
      setLoading(false);
    }
    setNovoAtivo({ nome: '', valorInvestido: 0, dataInvestimento: '' });
    setParametrosFixa({});
  };

  return (
    <div>
      <select value={tipoAtivo} onChange={(e) => setTipoAtivo(e.target.value as any)}>
        <option value="rendaVariavel">Renda Variável</option>
        <option value="rendaFixa">Renda Fixa</option>
      </select>

      {tipoAtivo === 'rendaFixa' && (
        <>
          <select value={categoriaFixa} onChange={(e) => setCategoriaFixa(e.target.value as any)}>
            <option value="prefixada">Prefixada</option>
            <option value="posFixada">Pós-fixada</option>
            <option value="hibrida">Híbrida</option>
          </select>

          {categoriaFixa === 'prefixada' && (
            <input
              type="number"
              placeholder="Taxa Prefixada (% a.a)"
              onChange={(e) => setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })}
            />
          )}
        </>
      )}

      <input
        type="text"
        placeholder="Nome do Ativo"
        value={novoAtivo.nome}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, nome: e.target.value })}
      />
      <input
        type="number"
        placeholder="Valor Investido"
        value={novoAtivo.valorInvestido}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, valorInvestido: parseFloat(e.target.value) })}
      />
      <input
        type="date"
        value={novoAtivo.dataInvestimento}
        onChange={(e) => setNovoAtivo({ ...novoAtivo, dataInvestimento: e.target.value })}
      />
      <button onClick={handleAddAtivo} disabled={loading}>
        {loading ? 'Carregando...' : 'Adicionar Ativo'}
      </button>
    </div>
  );
};

export default AtivoForm;
