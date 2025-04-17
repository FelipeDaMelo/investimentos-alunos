// src/components/AtivoForm.tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo } from '../MainPage';

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
    dataInvestimento: '',
  });

  // Ajustando a tipagem para garantir compatibilidade com os valores possíveis
  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  
  // Declarando corretamente o tipo de parametrosFixa como um objeto genérico
  const [parametrosFixa, setParametrosFixa] = useState<{ taxaPrefixada?: number; percentualSobreCDI?: number }>({});

  const handleAddAtivo = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      let valorAtual = '1';
      let patrimonioInicial = novoAtivo.valorInvestido;

      // Lógica para buscar o valor atual do ativo
      if (tipoAtivo === 'rendaVariavel' || tipoAtivo === 'cripto') {
        valorAtual = await fetchValorAtual(novoAtivo.nome);
        if (valorAtual === 'Erro ao carregar') {
          alert('Erro ao buscar o valor do ativo');
          return;
        }
      }

      // Lógica de renda variável: calcular quantidade de ações
      if (tipoAtivo === 'rendaVariavel') {
        const quantidade = Math.floor(novoAtivo.valorInvestido / parseFloat(valorAtual));
        if (quantidade < 1) {
          alert('Não é possível comprar menos de 1 ação.');
          return;
        }
        patrimonioInicial = quantidade * parseFloat(valorAtual);
      }

      // Criando o objeto do ativo
      const novoAtivoObj: Ativo = {
        id: uuidv4(),
        nome: novoAtivo.nome,
        valorInvestido: patrimonioInicial,
        dataInvestimento: novoAtivo.dataInvestimento,
        valorAtual,
        patrimonioPorDia: {
          [hoje]: patrimonioInicial,
        },
        tipo: tipoAtivo,
      };

      // Definindo dados específicos para cada tipo de ativo
      if (tipoAtivo === 'rendaFixa') {
        novoAtivoObj.categoriaFixa = categoriaFixa;
        novoAtivoObj.parametrosFixa = parametrosFixa;
      }

      if (tipoAtivo === 'cripto') {
        const fraçãoAdquirida = novoAtivo.valorInvestido / parseFloat(valorAtual);
        (novoAtivoObj as any).fraçãoAdquirida = fraçãoAdquirida;
      }

      // Chamando a função para adicionar o ativo
      onAddAtivo(novoAtivoObj);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Renderização específica para renda fixa */}
      {tipoAtivo === 'rendaFixa' && (
        <>
          <select value={categoriaFixa} onChange={(e) => setCategoriaFixa(e.target.value as 'prefixada' | 'posFixada' | 'hibrida')}>
            <option value="prefixada">Prefixada</option>
            <option value="posFixada">Pós-fixada</option>
            <option value="hibrida">Híbrida</option>
          </select>

          {categoriaFixa !== 'hibrida' ? (
            <input
              type="number"
              placeholder="Taxa (% a.a)"
              onChange={(e) =>
                setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })
              }
            />
          ) : (
            <>
              <input
                type="number"
                placeholder="Taxa Prefixada (% a.a)"
                onChange={(e) =>
                  setParametrosFixa((prev) => ({
                    ...prev,
                    taxaPrefixada: parseFloat(e.target.value),
                  }))
                }
              />
              <input
                type="number"
                placeholder="Taxa Pós-fixada (% a.a)"
                onChange={(e) =>
                  setParametrosFixa((prev) => ({
                    ...prev,
                    percentualSobreCDI: parseFloat(e.target.value),
                  }))
                }
              />
            </>
          )}
        </>
      )}

      {/* Campos comuns a todos os tipos de ativos */}
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
        onChange={(e) =>
          setNovoAtivo({ ...novoAtivo, valorInvestido: parseFloat(e.target.value) })
        }
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
