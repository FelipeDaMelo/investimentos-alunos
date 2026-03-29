import { Ativo } from '../types/Ativo';
import { RendaVariavelAtivo } from '../types/Ativo';
import { RendaFixaAtivo } from '../types/Ativo';
import Button from './Button';
import {
  ArrowUp,
  HandCoins,
  BadgeDollarSign,
  ShoppingCart,
  ArrowDown
} from 'lucide-react';

interface AtivoCardProps {
  ativo: Ativo;
  onSell: (id: string) => void;
  cor: string;
  onInformarDividendo?: () => void; 
  onInvestir?: (ativo: RendaFixaAtivo) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  const [ano, mes, dia] = dateString.split('-');
  return `${dia}/${mes}/${ano}`;
};

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onSell, cor, onInformarDividendo }) => {
  const isRendaVariavel = ativo.tipo === 'rendaVariavel';

  const precoMedio = isRendaVariavel && (ativo as RendaVariavelAtivo).quantidade > 0
    ? (ativo as RendaVariavelAtivo).valorInvestido / (ativo as RendaVariavelAtivo).quantidade
    : 0;

  const rendimentoPercentual = isRendaVariavel 
    ? (precoMedio > 0 ? (((ativo as RendaVariavelAtivo).valorAtual / precoMedio) - 1) * 100 : 0)
    : (ativo.valorInvestido > 0 ? ((ativo.valorAtual / ativo.valorInvestido) - 1) * 100 : 0);

  const rendimentoTotal = isRendaVariavel
    ? ((rendimentoPercentual / 100) * (ativo as RendaVariavelAtivo).valorInvestido)
    : 0;


const rendimentoCard = isRendaVariavel
  ? rendimentoTotal
  : ativo.valorAtual - ativo.valorInvestido;

// Em AtivoCard.tsx

// ✅ Lógica de classe aprimorada para incluir dark mode
const cardBgClass =
  rendimentoCard > 0
    ? 'bg-green-100 dark:bg-green-900/50' // Verde muito sutil no modo claro, e um verde escuro translúcido no modo escuro
    : rendimentoCard < 0
    ? 'bg-red-100 dark:bg-red-900/50' // Vermelho muito sutil no modo claro, e um vermelho escuro translúcido no modo escuro
    : 'bg-white dark:bg-gray-800'; // Fundo padrão

  return (
    <div 
      className={`bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-blue-100 group animate-fade-in`}
    >
      {/* Barra lateral de cor */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5" 
        style={{ backgroundColor: cor }}
      ></div>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: cor }}>
            {isRendaVariavel ? <ShoppingCart size={24} /> : <BadgeDollarSign size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg leading-tight">{ativo.nome}</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
              {ativo.tipo === 'rendaFixa' ? 'Renda Fixa' :
               ativo.subtipo === 'acao' ? 'Ação' :
               ativo.subtipo === 'fii' ? 'Fundo Imobiliário' : 'Criptomoeda'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-900 leading-tight">
            {formatCurrency(isRendaVariavel ? (ativo as RendaVariavelAtivo).valorAtual * (ativo as RendaVariavelAtivo).quantidade : ativo.valorAtual)}
          </p>
          <div className={`flex items-center justify-end gap-0.5 text-xs font-bold ${rendimentoCard >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {rendimentoCard >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(rendimentoPercentual).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-8 text-sm">
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Quantidade</p>
          <p className="font-bold text-slate-700">{isRendaVariavel ? (ativo as RendaVariavelAtivo).quantidade.toFixed(4) : '1.0000'}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Preço Médio</p>
          <p className="font-bold text-slate-700">{formatCurrency(precoMedio || ativo.valorInvestido)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Investido</p>
          <p className="font-bold text-slate-700">{formatCurrency(ativo.valorInvestido)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Resultado</p>
          <p className={`font-bold ${rendimentoCard >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {rendimentoCard >= 0 ? '+' : ''}{formatCurrency(rendimentoCard)}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-50 flex gap-2">
        <button 
          onClick={() => onSell(ativo.id)}
          className="flex-1 bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 group/btn"
        >
          <ShoppingCart size={18} className="group-hover/btn:scale-110 transition-transform" />
          <span>{ativo.tipo === 'rendaFixa' ? 'Resgatar' : 'Vender'}</span>
        </button>

        {onInformarDividendo && (
          <button 
            onClick={onInformarDividendo}
            className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl transition-colors"
            title="Informar Dividendo"
          >
            <HandCoins size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AtivoCard;
