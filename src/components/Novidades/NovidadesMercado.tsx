import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssetTrend {
  stock: string;
  name: string;
  close: number;
  change: number;
  logo: string;
}

interface MarketData {
  altas: AssetTrend[];
  baixas: AssetTrend[];
}

import Sidebar from '../Sidebar';

interface NovidadesMercadoProps {
  login: string;
  fotoGrupo: string | null;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
}

const NovidadesMercado: React.FC<NovidadesMercadoProps> = ({
  login,
  fotoGrupo,
  onLogout,
  onUploadConfirmado,
}) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/market-news');
      if (!res.ok) throw new Error('Falha ao buscar dados do mercado');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('Não foi possível carregar as novidades do mercado agora.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        login={login}
        fotoGrupo={fotoGrupo}
        onLogout={onLogout}
        onUploadConfirmado={onUploadConfirmado}
        onTriggerDelete={() => {}} // No delete on news page
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-28 md:p-8 md:pb-8 w-full min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <RefreshCw className={`w-8 h-8 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                Novidades do Mercado
              </h1>
              <p className="text-slate-500 mt-2">Veja os ativos que mais se destacaram hoje na B3.</p>
            </div>
            <button 
              onClick={fetchNews}
              className="p-3 bg-white dark:bg-slate-800 rounded-full shadow hover:shadow-lg transition-shadow"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && !data ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-500">Sincronizando com a B3...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
              <p>{error}</p>
              <button onClick={fetchNews} className="mt-4 text-blue-600 font-semibold hover:underline">Tentar novamente</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              
              {/* Seção de Altas */}
              <SectionLayout 
                title="Maiores Altas" 
                icon={<TrendingUp className="text-green-500" />} 
                colorClass="text-green-600"
                bgClass="bg-green-50 dark:bg-green-900/10"
              >
                {data?.altas.map((item, idx) => (
                  <TrendCard key={item.stock} item={item} index={idx} isPositive />
                ))}
              </SectionLayout>

              {/* Seção de Baixas */}
              <SectionLayout 
                title="Maiores Baixas" 
                icon={<TrendingDown className="text-red-500" />} 
                colorClass="text-red-600"
                bgClass="bg-red-50 dark:bg-red-900/10"
              >
                {data?.baixas.map((item, idx) => (
                  <TrendCard key={item.stock} item={item} index={idx} isPositive={false} />
                ))}
              </SectionLayout>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-12 text-center text-slate-400 text-sm">
            <p>Dados fornecidos por brapi.dev • Atualizados em tempo real (B3/Yahoo)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionLayout: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  colorClass: string;
  bgClass: string;
}> = ({ title, icon, children, colorClass, bgClass }) => (
  <div className={`p-6 rounded-3xl ${bgClass} border border-white/20 shadow-sm`}>
    <h2 className={`text-xl font-bold flex items-center gap-2 mb-6 ${colorClass}`}>
      {icon} {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const TrendCard: React.FC<{ item: AssetTrend; index: number; isPositive: boolean }> = ({ item, index, isPositive }) => (
  <motion.div 
    initial={{ opacity: 0, x: isPositive ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group"
  >
    <div className="flex items-center gap-4">
      {item.logo ? (
        <img src={item.logo} alt={item.stock} className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1" />
      ) : (
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400">
          {item.stock.substring(0, 2)}
        </div>
      )}
      <div>
        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors uppercase italic">{item.stock}</h3>
        <p className="text-xs text-slate-500 truncate w-32 md:w-48">{item.name}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-slate-800 dark:text-white">R$ {item.close.toFixed(2)}</p>
      <p className={`text-sm font-bold flex items-center justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{item.change.toFixed(2)}%
      </p>
    </div>
  </motion.div>
);

export default NovidadesMercado;
