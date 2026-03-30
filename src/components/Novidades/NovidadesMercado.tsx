import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../Sidebar';

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

interface MarketSummaryItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

interface MarketSummary {
  ibov?: MarketSummaryItem;
  dolar?: MarketSummaryItem;
  btc?: MarketSummaryItem;
}

interface NewsItem {
  title: string;
  link: string;
  timeAgo: string;
}

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
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsRes, summaryRes, newsRes] = await Promise.all([
        fetch('/api/market-news'),
        fetch('/api/market-summary'),
        fetch('/api/news')
      ]);

      if (!trendsRes.ok || !summaryRes.ok || !newsRes.ok) throw new Error('Falha ao buscar dados');

      const [trendsJson, summaryJson, newsJson] = await Promise.all([
        trendsRes.json(),
        summaryRes.json(),
        newsRes.json()
      ]);

      setData(trendsJson);
      setSummary(summaryJson);
      setNews(newsJson);
    } catch (err) {
      setError('Não foi possível carregar todas as novidades agora.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar 
        login={login}
        fotoGrupo={fotoGrupo}
        onLogout={onLogout}
        onUploadConfirmado={onUploadConfirmado}
        onTriggerDelete={() => {}}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-28 md:p-8 md:pb-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <Globe className={`w-8 h-8 text-blue-600 ${loading ? 'animate-pulse' : ''}`} />
                Dashboard do Mercado
              </h1>
              <p className="text-slate-500 mt-2 font-medium">Panorama geral da economia e principais destaques.</p>
            </div>
            <button 
              onClick={fetchAllData}
              disabled={loading}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="Atualizar tudo"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Termômetro do Mercado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard title="Ibovespa" data={summary?.ibov} />
            <SummaryCard title="Dólar Comercial" data={summary?.dolar} prefix="R$" />
            <SummaryCard title="Bitcoin (BRL)" data={summary?.btc} prefix="R$" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-center mb-8">
              <p className="font-bold">{error}</p>
              <button onClick={fetchAllData} className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors font-bold uppercase text-xs">Tentar novamente</button>
            </div>
          )}

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna de Altas e Baixas (2/3) */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Seção de Altas */}
                <SectionLayout 
                  title="Maiores Altas" 
                  icon={<TrendingUp className="text-green-500" />} 
                  colorClass="text-green-600"
                  bgClass="bg-green-50 dark:bg-green-900/10"
                >
                  {loading && !data ? <LoadingPlaceholder /> : data?.altas.map((item, idx) => (
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
                  {loading && !data ? <LoadingPlaceholder /> : data?.baixas.map((item, idx) => (
                    <TrendCard key={item.stock} item={item} index={idx} isPositive={false} />
                  ))}
                </SectionLayout>
              </div>
            </div>

            {/* Coluna de Notícias (1/3) */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-8">
                  <div className="w-2 h-8 bg-blue-600 rounded-full" />
                  Feed de Notícias
                </h2>
                
                <div className="space-y-1">
                  {loading && news.length === 0 ? (
                    [1,2,3,4,5].map(i => <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse mb-4" />)
                  ) : news.map((item, idx) => (
                    <motion.a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="block p-4 -mx-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.timeAgo}</span>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h3 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>
                    </motion.a>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-widest leading-relaxed">
                    Via InfoMoney RSS<br/>
                    Atualizado em tempo real
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
            <p>Market Data via Brapi API • Dashboard Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ title: string; data?: MarketSummaryItem; prefix?: string }> = ({ title, data, prefix = '' }) => {
  const isPositive = (data?.changePercent || 0) >= 0;
  
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            {!data ? '---' : `${prefix} ${data.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </p>
          <div className={`flex items-center gap-1 mt-1 text-sm font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {data ? (isPositive ? '+' : '') + data.changePercent.toFixed(2) + '%' : '0.00%'}
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          {isPositive ? <TrendingUp className="text-green-500" size={24} /> : <TrendingDown className="text-red-500" size={24} />}
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
  <div className={`p-7 rounded-[2.5rem] ${bgClass} border border-white/20 shadow-sm w-full`}>
    <h2 className={`text-xl font-black flex items-center gap-3 mb-8 ${colorClass}`}>
      <div className={`w-2 h-8 rounded-full ${title.includes('Altas') ? 'bg-green-500' : 'bg-red-500'}`} />
      {title}
    </h2>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const TrendCard: React.FC<{ item: AssetTrend; index: number; isPositive: boolean }> = ({ item, index, isPositive }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md hover:-translate-y-1 transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-2 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
        {item.logo ? (
          <img src={item.logo} alt={item.stock} className="w-full h-full object-contain" />
        ) : (
          <span className="font-bold text-slate-400 text-xs">{item.stock.substring(0, 3)}</span>
        )}
      </div>
      <div>
        <h3 className="font-black text-slate-800 dark:text-white uppercase transition-colors text-sm tracking-tight">{item.stock}</h3>
        <p className="text-[10px] font-bold text-slate-400 truncate w-24 md:w-40 uppercase tracking-tighter">{item.name}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-black text-slate-800 dark:text-white">R$ {item.close.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p className={`text-xs font-black flex items-center justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{item.change.toFixed(2)}%
      </p>
    </div>
  </motion.div>
);

const LoadingPlaceholder = () => (
  <div className="space-y-4">
    {[1,2,3,4].map(i => <div key={i} className="h-20 bg-white/50 dark:bg-slate-800/50 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-700" />)}
  </div>
);

export default NovidadesMercado;
