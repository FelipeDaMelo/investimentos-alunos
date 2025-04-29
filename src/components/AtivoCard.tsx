import { Ativo } from '../types/Ativo';
import Button from './Button';

interface AtivoCardProps {
  ativo: Ativo;
  onSell: (id: string) => void;
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

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onSell, cor }) => {
  return (
    <div 
      className="border-l-4 p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow"
      style={{ borderLeftColor: cor }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{ativo.nome}</h3>
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

      <Button
  onClick={() => onSell(ativo.id)}
  className="mt-3"
>
  Vender
</Button>
    </div>
  );
};

export default AtivoCard;
