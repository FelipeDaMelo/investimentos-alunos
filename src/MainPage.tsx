// src/MainPage.tsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import AtivoForm from './components/AtivoForm';
import AtivoCard from './components/AtivoCard';
import useAtualizarAtivos from './hooks/useAtualizarAtivos';
import { Ativo } from './types/Ativo'; 

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const formatarData = (dataISO: string) => {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
};

interface MainPageProps {
  login: string;
  valorInvestido: number;
  fixo: number;
  variavel: number;
  nomeGrupo: string;
}

const MainPage = ({ login, valorInvestido, fixo, variavel, nomeGrupo }: MainPageProps) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [valorCriptoDisponivel, setValorCriptoDisponivel] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);

      let ativos: Ativo[] = [];
      let porcentagemFixa = fixo;
      let porcentagemVariavel = variavel;

      if (docSnap.exists()) {
        const data = docSnap.data();
        ativos = (data.ativos || []).map((a: any) => ({
          ...a,
          patrimonioPorDia: a.patrimonioPorDia || {},
        }));
        porcentagemFixa = data.porcentagemFixa ?? fixo;
        porcentagemVariavel = data.porcentagemVariavel ?? variavel;
      } else {
        await setDoc(docRef, {
          ativos: [],
          porcentagemFixa: fixo,
          porcentagemVariavel: variavel
        });
      }

      const porcentagemCripto = 100 - (porcentagemFixa + porcentagemVariavel);
      setAtivos(ativos);
      setValorFixaDisponivel(valorInvestido * (porcentagemFixa / 100) - calcularTotalInvestido(ativos, 'rendaFixa'));
      setValorVariavelDisponivel(valorInvestido * (porcentagemVariavel / 100) - calcularTotalInvestido(ativos, 'rendaVariavel'));
      setValorCriptoDisponivel(valorInvestido * (porcentagemCripto / 100) - calcularTotalInvestido(ativos, 'cripto'));
    };
    fetchData();
  }, [login, valorInvestido, fixo, variavel]);

  useEffect(() => {
    const saveData = async () => {
      const docRef = doc(db, 'usuarios', login);
      try {
        const ativosLimpos = ativos.map((ativo) => {
          const novoAtivo: any = { ...ativo };
          Object.keys(novoAtivo).forEach((key) => {
            if (novoAtivo[key] === undefined) {
              delete novoAtivo[key];
            }
          });
          return novoAtivo;
        });
        await setDoc(docRef, {
          ativos: ativosLimpos,
          porcentagemFixa: fixo,
          porcentagemVariavel: variavel
        }, { merge: true });
      } catch (error) {
        console.error('Erro ao salvar dados no Firebase:', error);
      }
    };
    if (ativos.length > 0) saveData();
  }, [ativos, login, fixo, variavel]);

  useAtualizarAtivos(ativos, setAtivos);

  const calcularTotalInvestido = (ativos: Ativo[], tipo: 'rendaFixa' | 'rendaVariavel' | 'cripto') => {
    return ativos.filter(a => a.tipo === tipo).reduce((total, a) => total + a.valorInvestido, 0);
  };

  const handleAddAtivo = (ativo: Ativo) => {
    setAtivos((prev) => [...prev, ativo]);
    if (ativo.tipo === 'rendaFixa') {
      setValorFixaDisponivel((prev) => prev - ativo.valorInvestido);
    } else if (ativo.tipo === 'rendaVariavel') {
      setValorVariavelDisponivel((prev) => prev - ativo.valorInvestido);
    } else if (ativo.tipo === 'cripto') {
      setValorCriptoDisponivel((prev) => prev - ativo.valorInvestido);
    }
  };

  const handleDeleteAtivo = (id: string) => {
    const ativoRemovido = ativos.find((ativo) => ativo.id === id);
    if (ativoRemovido) {
      if (ativoRemovido.tipo === 'rendaFixa') {
        setValorFixaDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      } else if (ativoRemovido.tipo === 'rendaVariavel') {
        setValorVariavelDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      } else if (ativoRemovido.tipo === 'cripto') {
        setValorCriptoDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      }
    }
    const atualizados = ativos.filter((ativo) => ativo.id !== id);
    setAtivos(atualizados);
  };

  const allDates = Array.from(
    new Set(ativos.flatMap((ativo) => Object.keys(ativo.patrimonioPorDia)))
  ).sort();

  const cores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

  const chartData = {
    labels: allDates.map(formatarData),
    datasets: ativos.map((ativo, i) => ({
      label: ativo.nome,
      data: allDates.map((date) => ativo.patrimonioPorDia[date] || 0),
      borderColor: cores[i % cores.length],
      fill: false,
    })),
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">Monitoramento de Ativos - Usuário: {login}</h1>
      {loading && <p className="text-yellow-600">Salvando...</p>}

      <p className="mb-2">Renda Fixa disponível: R$ {valorFixaDisponivel.toFixed(2)}</p>
      <p className="mb-4">Renda Variável / Criptomoedas disponível: R$ {(valorVariavelDisponivel + valorCriptoDisponivel).toFixed(2)}</p>

      <AtivoForm onAddAtivo={handleAddAtivo} loading={loading} setLoading={setLoading} tipoAtivo="rendaFixa" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {ativos.map((ativo) => (
          <AtivoCard key={ativo.id} ativo={ativo} onDelete={handleDeleteAtivo} />
        ))}
      </div>
      <div className="mt-6">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default MainPage;
