// src/components/AtivoForm.tsx
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from '../fetchValorAtual';
import { Ativo } from '../hooks/useAtualizarAtivos';
import { Ativo, CriptoAtivo } from '../hooks/useAtualizarAtivos';


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

  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<Ativo['parametrosFixa']>({});

  const handleAddAtivo = async () => {
    setLoading(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      let valorAtual = '1';
      let patrimonioInicial = novoAtivo.valorInvestido;

      if (tipoAtivo === 'rendaVariavel' || tipoAtivo === 'cripto') {
        valorAtual = await fetchValorAtual(novoAtivo.nome);
        if (valorAtual === 'Erro ao carregar') {
          alert('Erro ao buscar o valor do ativo');
          return;
        }
      }

      if (tipoAtivo === 'rendaVariavel') {
        const quantidade = Math.floor(novoAtivo.valorInvestido / parseFloat(valorAtual));
        if (quantidade < 1) {
          alert('Não é possível comprar menos de 1 ação.');
          return;
        }
        patrimonioInicial = quantidade * parseFloat(valorAtual);
      }

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

      if (tipoAtivo === 'rendaFixa') {
        novoAtivoObj.categoriaFixa = categoriaFixa;
        novoAtivoObj.parametrosFixa = parametrosFixa;
      }

      if (tipoAtivo === 'cripto') {
        const fracaoAdquirida = novoAtivo.valorInvestido / parseFloat(valorAtual);
        (novoAtivoObj as CriptoAtivo).fracaoAdquirida = fracaoAdquirida;
      }

      onAddAtivo(novoAtivoObj);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {tipoAtivo === 'rendaFixa' && (
        <>
          <select value={categoriaFixa} onChange={(e) => {
            setCategoriaFixa(e.target.value as any);
            setParametrosFixa({});
          }}>
            <option value="prefixada">Prefixada</option>
            <option value="posFixada">Pós-fixada</option>
            <option value="hibrida">Híbrida</option>
          </select>

          {categoriaFixa === 'prefixada' && (
            <input
              type="number"
              placeholder="Taxa Prefixada (% a.a)"
              onChange={(e) =>
                setParametrosFixa({ taxaPrefixada: parseFloat(e.target.value) })
              }
            />
          )}

          {categoriaFixa === 'posFixada' && (
            <>
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
              >
                <option value="">Selecione o índice</option>
                <option value="CDI">% CDI</option>
                <option value="SELIC">% SELIC</option>
              </select>
            </>
          )}

          {categoriaFixa === 'hibrida' && (
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
                placeholder="IPCA estimado (% a.a)"
                onChange={(e) =>
                  setParametrosFixa((prev) => ({
                    ...prev,
                    ipca: parseFloat(e.target.value),
                  }))
                }
              />
            </>
          )}
        </>
      )}

      {/* Campos comuns a todos os tipos */}
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
