import { Ativo } from '../types/Ativo';

interface AtivoCardProps {
  ativo: Ativo;
  onDelete: (id: string) => void;
}

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onDelete }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg">{ativo.nome}</h3>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
          {ativo.tipo === 'rendaFixa' ? 'Renda Fixa' : 
           ativo.subtipo === 'acao' ? 'Ação' :
           ativo.subtipo === 'fii' ? 'FII' : 'Criptomoeda'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>Investido:</div>
        <div className="font-medium">R$ {ativo.valorInvestido.toFixed(2)}</div>
        
        <div>Valor Atual:</div>
        <div className="font-medium">R$ {ativo.valorAtual.toFixed(2)}</div>
        
        <div>Data:</div>
        <div>{new Date(ativo.dataInvestimento).toLocaleDateString()}</div>
      </div>

      {ativo.tipo === 'rendaFixa' && (
        <div className="mt-3 text-sm">
          <div>Categoria: {ativo.categoriaFixa}</div>
          {ativo.parametrosFixa && (
            <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
              <pre>{JSON.stringify(ativo.parametrosFixa, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {ativo.tipo === 'rendaVariavel' && (
        <div className="mt-3 text-sm">
          <div>Ticker: {ativo.tickerFormatado}</div>
          <div>Quantidade: {ativo.quantidade.toFixed(2)}</div>
        </div>
      )}

      <button 
        onClick={() => onDelete(ativo.id)}
        className="mt-3 text-red-600 hover:text-red-800 text-sm"
      >
        Remover Ativo
      </button>
    </div>
  );
};

export default AtivoCard;