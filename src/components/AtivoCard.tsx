import { useState } from 'react';
import { Ativo } from '../types/Ativo';
import { Banknote, TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight, ShoppingCart } from 'lucide-react';

interface AtivoCardProps {
  ativo: Ativo;
  onVender: (id: string, quantidade: number) => void;
  cor: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
};

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onVender, cor }) => {
  const [quantidadeVenda, setQuantidadeVenda] = useState(0);
  const [erro, setErro] = useState('');

  const handleVenda = () => {
    if (ativo.tipo === 'rendaFixa') {
      onVender(ativo.id, 0); // vende tudo
      return;
    }

    if (quantidadeVenda <= 0 || quantidadeVenda > ativo.quantidade) {
      setErro('Quantidade inválida');
      return;
    }

    onVender(ativo.id, quantidadeVenda);
    setQuantidadeVenda(0);
    setErro('');
  };

  // Ícone baseado no tipo de ativo
  const Icon = 
    ativo.tipo === 'rendaFixa' ? <Landmark className="inline w-4 h-4 mr-1" /> :
    ativo.subtipo === 'acao' ? <TrendingUp className="inline w-4 h-4 mr-1" /> :
    ativo.subtipo === 'fii' ? <Banknote className="inline w-4 h-4 mr-1" /> :
    <TrendingDown className="inline w-4 h-4 mr-1" />;

  // Cálculo de lucro ou prejuízo
  const lucro = ativo.valorAtual - ativo.valorInvestido;

  return (
    <div 
      className="border-l-4 p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
      style={{ borderLeftColor: cor }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg flex items-center">
            {Icon}
            {ativo.nome}
          </h3>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
            {ativo.tipo === 'rendaFixa' ? 'Renda Fixa' : 
             ativo.subtipo === 'acao' ? 'Ação' :
             ativo.subtipo === 'fii' ? 'FII' : 'Criptomoeda'}
          </span>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(ativo.valorAtual)}</p>
          <p className="text-sm text-gray-500">
            {formatDate(ativo.dataInvestimento)}
          </p>
        </div>
      </div>

      {/* Exibe lucro ou prejuízo com ícones */}
      <div className={lucro >= 0 ? 'text-green-600 flex items-center' : 'text-red-600 flex items-center'}>
        {lucro >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {formatCurrency(lucro)} ({((lucro / ativo.valorInvestido) * 100).toFixed(2)}%)
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>Investido:</div>
        <div className="font-medium">{formatCurrency(ativo.valorInvestido)}</div>
        
        {ativo.tipo === 'rendaVariavel' && (
          <>
            <div>Quantidade:</div>
            <div>{ativo.quantidade.toFixed(2)}</div>
          </>
        )}
      </div>

      {ativo.tipo === 'rendaVariavel' ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            value={quantidadeVenda}
            onChange={(e) => setQuantidadeVenda(Number(e.target.value))}
            placeholder="Qtd a vender"
            className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
            min={0}
            max={ativo.quantidade}
          />
          <button 
            onClick={handleVenda}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
          >
            <ShoppingCart className="w-4 h-4" />
            Vender
          </button>
        </div>
      ) : (
        <button 
          onClick={handleVenda}
          className="mt-3 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          <ShoppingCart className="w-4 h-4" />
          Vender Tudo
        </button>
      )}

      {erro && <p className="text-red-600 text-sm mt-1">{erro}</p>}
    </div>
  );
};

export default AtivoCard;
