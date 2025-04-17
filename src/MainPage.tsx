// src/MainPage.tsx
import React, { useState, useEffect } from 'react';
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

interface MainPageProps {
  valorInvestido: number;
  fixo: number;
  variavel: number;
}

export interface Ativo {
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

const MainPage: React.FC<MainPageProps> = ({ valorInvestido, fixo, variavel }) => {
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [loading, setLoading] = useState(false);
  const [valorFixaDisponivel, setValorFixaDisponivel] = useState(0);
  const [valorVariavelDisponivel, setValorVariavelDisponivel] = useState(0);
  const [login, setLogin] = useState<string>('userLogin'); // Substitua por como você armazena o login do usuário.

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, 'usuarios', login);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const ativos = data.ativos || [];
        const porcentagemFixa = data.porcentagemFixa || 0;
        const porcentagemVariavel = data.porcentagemVariavel || 0;

        setAtivos(ativos);
        setValorFixaDisponivel(valorInvestido * (porcentagemFixa / 100) - calcularTotalInvestido(ativos, 'rendaFixa'));
        setValorVariavelDisponivel(valorInvestido * (porcentagemVariavel / 100) - calcularTotalInvestido(ativos, 'rendaVariavel'));
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
        await setDoc(docRef, { ativos: ativosSemUndefined }, { merge: true });
      } catch (error) {
        console.error('Erro ao salvar dados no Firebase:', error);
      }
    };
    if (ativos.length > 0) saveData();
  }, [ativos, login]);

  useAtualizarAtivos(ativos, setAtivos);

  const calcularTotalInvestido = (ativos: Ativo[], tipo: 'rendaFixa' | 'rendaVariavel') => {
    return ativos.filter(a => a.tipo === tipo).reduce((total, a) => total + a.valorInvestido, 0);
  };

  const handleAddAtivo = (ativo: Ativo) => {
    setAtivos((prev) => [...prev, ativo]);
    if (ativo.tipo === 'rendaFixa') {
      setValorFixaDisponivel((prev) => prev - ativo.valorInvestido);
    } else if (ativo.tipo === 'rendaVariavel') {
      setValorVariavelDisponivel((prev) => prev - ativo.valorInvestido);
    }
  };

  const handleDeleteAtivo = (id: string) => {
    const ativoRemovido = ativos.find((ativo) => ativo.id === id);
    if (ativoRemovido) {
      if (ativoRemovido.tipo === 'rendaFixa') {
        setValorFixaDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      } else if (ativoRemovido.tipo === 'rendaVariavel') {
        setValorVariavelDisponivel((prev) => prev + ativoRemovido.valorInvestido);
      }
    }
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
      <h1>Monitoramento de Ativos - Usuário</h1>
      <p>Valor Investido: R$ {valorInvestido}</p>
      <p>Renda Fixa disponível: R$ {valorFixaDisponivel.toFixed(2)}</p>
      <p>Renda Variável disponível: R$ {valorVariavelDisponivel.toFixed(2)}</p>
      <AtivoForm onAddAtivo={handleAddAtivo} loading={loading} setLoading={setLoading} tipoAtivo="rendaFixa" />
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
