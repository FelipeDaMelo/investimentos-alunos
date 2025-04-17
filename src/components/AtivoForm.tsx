// src/components/AtivoForm.tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';

interface Props {
  onAddAtivo: (ativo: any) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
  tipoAtivo: 'rendaVariavel' | 'rendaFixa' | 'cripto'; // Três tipos agora
}

const AtivoForm = ({ onAddAtivo, loading, setLoading, tipoAtivo }: Props) => {
  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: '',
  });

  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<any>({});

  // Função para adicionar Ativo de Renda Fixa
  const handleAddAtivoRendaFixa = async () => {
    setLoading(true);
    try {
      let valorAtual = '1';
      if (tipoAtivo === 'rendaVariavel') {
        valorAtual = await fetchValorAtual(novoAtivo.nome);
      }

      const patrimonioInicial = novoAtivo.valorInvestido; // Aqui para renda fixa, podemos usar o valor investido diretamente.

      const novoAtivoObj = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: novoAtivo.valorInvestido,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual,
        patrimonioPorDia: {
          [new Date().toISOString().split('T')[0]]: patrimonioInicial,
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
  };

  // Função para adicionar Ativo de Renda Variável
  const handleAddAtivoRendaVariavel = async () => {
    setLoading(true);
    try {
      const valorAtual = await fetchValorAtual(novoAtivo.nome);
      if (valorAtual === 'Erro ao carregar') {
        alert('Erro ao buscar o valor do ativo');
        setLoading(false);
        return;
      }

      const quantidadeAcoes = Math.floor(novoAtivo.valorInvestido / parseFloat(valorAtual));
      if (quantidadeAcoes < 1) {
        alert('Não é possível comprar menos de 1 ação.');
        setLoading(false);
        return;
      }

      const patrimonioInicial = quantidadeAcoes * parseFloat(valorAtual);

      const novoAtivoObj = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual,
        patrimonioPorDia: {
          [new Date().toISOString().split('T')[0]]: patrimonioInicial,
        },
        tipo: 'rendaVariavel',
      };

      onAddAtivo(novoAtivoObj);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar Criptomoeda
  const handleAddAtivoCripto = async () => {
    setLoading(true);
    try {
      const valorAtual = await fetchValorAtual(novoAtivo.nome);
      if (valorAtual === 'Erro ao carregar') {
        alert('Erro ao buscar o valor da criptomoeda');
        setLoading(false);
        return;
      }

      const fraçãoAdquirida = novoAtivo.valorInvestido / parseFloat(valorAtual);

      const novoAtivoObj = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: novoAtivo.valorInvestido,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual,
        patrimonioPorDia: {
          [new Date().toISOString().split('T')[0]]: novoAtivo.valorInvestido,
        },
        tipo: 'cripto',
        fraçãoAdquirida,
      };

      onAddAtivo(novoAtivoObj);
    } catch (error) {
      console.error('Erro ao adicionar criptoativo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para selecionar a lógica a ser utilizada
  const handleAddAtivo = () => {
    if (tipoAtivo === 'rendaFixa') {
      handleAddAtivoRendaFixa();
    } else if (tipoAtivo === 'rendaVariavel') {
      handleAddAtivoRendaVariavel();
    } else if (tipoAtivo === 'cripto') {
      handleAddAtivoCripto();
    }
  };

  return (
    <div>
      <select value={categoriaFixa} onChange={(e) => setCategoriaFixa(e.target.value as any)}>
        <option value="prefixada">Prefixada</option>
        <option value="posFixada">Pós-fixada</option>
        <option value="hibrida">Híbrida</option>
      </select>

      {categoriaFixa !== 'hibrida' ? (
        <input
          type="number"
          placeholder="Taxa Prefixada ou Pós-fixada (% a.a)"
          onChange={(e) => setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })}
        />
      ) : (
        <>
          <input
            type="number"
            placeholder="Taxa Prefixada (% a.a)"
            onChange={(e) => setParametrosFixa({ ...parametrosFixa, taxaPrefixada: parseFloat(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Taxa Pós-fixada (% a.a)"
            onChange={(e) => setParametrosFixa({ ...parametrosFixa, taxaPosFixada: parseFloat(e.target.value) })}
          />
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
