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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAtivos(docSnap.data().ativos || []);
      } else {
        await setDoc(docRef, { ativos: [] });
      }
    };
    fetchData();
  }, [login]);

  useEffect(() => {
    const saveData = async () => {
      const docRef = doc(db, 'usuarios', login);
      try {
        const ativosSemUndefined = ativos.map((ativo) => {
          const novoAtivo: any = { ...ativo };
          if (!novoAtivo.tipo) delete novoAtivo.tipo;
          if (!novoAtivo.categoriaFixa) delete novoAtivo.categoriaFixa;
          if (!novoAtivo.parametrosFixa || Object.keys(novoAtivo.parametrosFixa).length === 0) {
            delete novoAtivo.parametrosFixa;
          }
          return novoAtivo;
        });
        await setDoc(docRef, { ativos: ativosSemUndefined });
      } catch (error) {
        console.error('Erro ao salvar dados no Firebase:', error);
      }
    };
    if (ativos.length > 0) saveData();
  }, [ativos, login]);

  useAtualizarAtivos(ativos, setAtivos);

  const handleAddAtivo = (ativo: Ativo) => {
    setAtivos([...ativos, ativo]);
  };

  const handleDeleteAtivo = (id: string) => {
    const atualizados = ativos.filter((ativo) => ativo.id !== id);
    setAtivos(atualizados);
  };

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
      <AtivoForm onAddAtivo={handleAddAtivo} loading={loading} setLoading={setLoading} />
      <div>
        {ativos.map((ativo) => (
          <AtivoCard key={ativo.id} ativo={ativo} onDelete={handleDeleteAtivo} />
        ))}
      </div>
      <div>
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default MainPage;
