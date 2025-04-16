// src/MainPage.tsx
import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import fetchValorAtual from './fetchValorAtual';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface Ativo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: string | number;
  patrimonioPorDia: { [key: string]: number };
  tipo?: 'rendaVariavel' | 'rendaFixa';
  categoriaFixa?: 'prefixada' | 'posFixada' | 'hibrida';
  parametrosFixa?: {
    taxaPrefixada?: number;
    percentualSobreCDI?: number;
    percentualSobreSELIC?: number;
    ipca?: number;
  };
}

const formatarData = (dataISO: string) => {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

const MainPage = ({ login }: { login: string }) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [novoAtivo, setNovoAtivo] = useState({
    nome: '',
    valorInvestido: 0,
    dataInvestimento: '',
  });
  const [tipoAtivo, setTipoAtivo] = useState<'rendaVariavel' | 'rendaFixa'>('rendaVariavel');
  const [categoriaFixa, setCategoriaFixa] = useState<'prefixada' | 'posFixada' | 'hibrida'>('prefixada');
  const [parametrosFixa, setParametrosFixa] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAtivos(docSnap.data().ativos || []);
      }
    };
    fetchData();
  }, [login]);

  useEffect(() => {
    if (ativos.length === 0) return;
    const saveData = async () => {
      const docRef = doc(db, 'usuarios', login);
      await setDoc(docRef, { ativos });
    };
    saveData();
  }, [ativos, login]);

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

      const novoAtivoObj: Ativo = {
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
      setAtivos([...ativos, novoAtivoObj]);
    } catch (error) {
      console.error('Erro ao adicionar ativo:', error);
    } finally {
      setLoading(false);
    }
    setNovoAtivo({ nome: '', valorInvestido: 0, dataInvestimento: '' });
    setParametrosFixa({});
  };

  const handleDeleteAtivo = (id: string) => {
    const atualizados = ativos.filter((ativo) => ativo.id !== id);
    setAtivos(atualizados);
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const diasPassados = Math.floor(
              (new Date(hoje).getTime() - new Date(ativo.dataInvestimento).getTime()) / (1000 * 60 * 60 * 24)
            );
            let rendimento = 0;
            if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
              const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
              rendimento = ativo.valorInvestido * Math.pow(1 + diaria, diasPassados);
            }
            return {
              ...ativo,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: rendimento,
              },
            };
          } else {
            const valorAtual = await fetchValorAtual(ativo.nome);
            const updatedPatrimonio = ativo.valorInvestido * parseFloat(valorAtual);
            return {
              ...ativo,
              valorAtual,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: updatedPatrimonio,
              },
            };
          }
        })
      );
      setAtivos(updatedAtivos);
    }, 86400000);

    return () => clearInterval(intervalId);
  }, [ativos]);

  const allDates = Array.from(
    new Set(ativos.flatMap((ativo) => Object.keys(ativo.patrimonioPorDia)))
  ).sort();

  const chartData = {
    labels: allDates.map(formatarData),
    datasets: ativos.map((ativo) => ({
      label: ativo.nome,
      data: allDates.map((date) => ativo.patrimonioPorDia[date] || 0),
      borderColor: 'rgba(75,192,192,1)',
      fill: false,
    })),
  };

  return (
    <div>
      <h1>Monitoramento de Ativos - Usuário: {login}</h1>

      <select value={tipoAtivo} onChange={(e) => setTipoAtivo(e.target.value as 'rendaVariavel' | 'rendaFixa')}>
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
              placeholder="Taxa Prefixada (a.a)"
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
        onChange={(e) =>
          setNovoAtivo({
            ...novoAtivo,
            valorInvestido: parseFloat(e.target.value),
          })
        }
      />
      <input
        type="date"
        value={novoAtivo.dataInvestimento}
        onChange={(e) =>
          setNovoAtivo({
            ...novoAtivo,
            dataInvestimento: e.target.value,
          })
        }
      />
      <button onClick={handleAddAtivo} disabled={loading}>
        {loading ? 'Carregando...' : 'Adicionar Ativo'}
      </button>

      <div>
        {ativos.map((ativo) => (
          <div key={ativo.id}>
            <h3>{ativo.nome}</h3>
            <p>Investido: {ativo.valorInvestido}</p>
            <p>Data do Investimento: {formatarData(ativo.dataInvestimento)}</p>
            <p>Valor Atual: {ativo.valorAtual}</p>
            <button onClick={() => handleDeleteAtivo(ativo.id)}>Excluir</button>
          </div>
        ))}
      </div>

      <div>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default MainPage;
