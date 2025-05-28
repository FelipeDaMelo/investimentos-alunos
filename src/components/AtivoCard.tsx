// ✅ AtivoCard.tsx
import { Ativo } from '../types/Ativo';
import { RendaVariavelAtivo } from '../types/Ativo';
import Button from './Button';

interface AtivoCardProps {
  ativo: Ativo;
  onSell: (id: string) => void;
  cor: string;
  onInformarDividendo?: (ativo: RendaVariavelAtivo) => void;
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

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onSell, cor, onInformarDividendo }) => {

  const isRendaVariavel = ativo.tipo === 'rendaVariavel';

  const precoMedio = isRendaVariavel && (ativo as RendaVariavelAtivo).quantidade > 0
    ? (ativo as RendaVariavelAtivo).valorInvestido / (ativo as RendaVariavelAtivo).quantidade
    : 0;

  const rendimentoPercentual = isRendaVariavel && precoMedio > 0
    ? (((ativo as RendaVariavelAtivo).valorAtual / precoMedio) - 1) * 100
    : 0;

  const rendimentoTotal = isRendaVariavel
    ? ((rendimentoPercentual / 100) * (ativo as RendaVariavelAtivo).valorInvestido)
    : 0;

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
              ativo.subtipo === 'fii' ? 'Fundo Imobiliário' : 'Criptomoeda'}
          </span>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(ativo.valorAtual)}</p>
          <p className="text-sm text-gray-500">{formatDate(ativo.dataInvestimento)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>Investido:</div>
        <div className="font-medium">{formatCurrency(ativo.valorInvestido)}</div>

        {/* Renda Fixa */}
  {ativo.tipo === 'rendaFixa' && (
  <>
    <div>Rendimento:</div>
    <div className={ativo.valorAtual - ativo.valorInvestido >= 0 ? 'text-green-600' : 'text-red-600'}>
      {formatCurrency(ativo.valorAtual - ativo.valorInvestido)} ({((ativo.valorAtual - ativo.valorInvestido) / ativo.valorInvestido * 100).toFixed(2)}%)
    </div>

    <div>Tipo de Rendimento:</div>
    <div className="capitalize">{ativo.categoriaFixa}</div>

    {ativo.categoriaFixa === 'prefixada' && (
      <>
        <div>Taxa Prefixada (a.a):</div>
        <div>{(ativo.parametrosFixa.taxaPrefixada ?? 0).toFixed(2)}%</div>
      </>
    )}

    {ativo.categoriaFixa === 'posFixada' && (
      <>
        {(ativo.parametrosFixa.percentualCDI ?? 0) > 0 && (
          <>
            <div>Índice:</div>
            <div>CDI</div>
            <div>Percentual:</div>
            <div>{(ativo.parametrosFixa.percentualCDI ?? 0).toFixed(2)}%</div>
            <div>Taxa CDI usada:</div>
            <div>{(ativo.parametrosFixa.cdiUsado ?? 0) .toFixed(4)}% a.d.</div>
          </>
        )}
        {(ativo.parametrosFixa.percentualSELIC ?? 0) > 0 && (
          <>
            <div>Índice:</div>
            <div>SELIC</div>
            <div>Percentual:</div>
            <div>{(ativo.parametrosFixa.percentualSELIC ?? 0).toFixed(2)}%</div>
            <div>Taxa SELIC usada:</div>
            <div>{(ativo.parametrosFixa.selicUsado ?? 0) .toFixed(4)}% a.d.</div>
          </>
        )}
      </>
    )}

    {ativo.categoriaFixa === 'hibrida' && (
      <>
        <div>Taxa Prefixada:</div>
        <div>{(ativo.parametrosFixa.taxaPrefixada ?? 0).toFixed(2)}%</div>

        {(ativo.parametrosFixa.percentualCDI ?? 0) > 0 && (
          <>
            <div>Índice:</div>
            <div>CDI</div>
            <div>Percentual:</div>
            <div>{(ativo.parametrosFixa.percentualCDI ?? 0).toFixed(2)}%</div>
            <div>Taxa CDI usada:</div>
            <div>{(ativo.parametrosFixa.cdiUsado ?? 0) .toFixed(4)}% a.d.</div>
          </>
        )}
        {(ativo.parametrosFixa.percentualSELIC ?? 0) > 0 && (
          <>
            <div>Índice:</div>
            <div>SELIC</div>
            <div>Percentual:</div>
            <div>{(ativo.parametrosFixa.percentualSELIC ?? 0).toFixed(2)}%</div>
             <div>Taxa SELIC usada:</div>
            <div>{(ativo.parametrosFixa.selicUsado ?? 0) .toFixed(4)}% a.d.</div>
          </>
        )}
        {(ativo.parametrosFixa.ipca ?? 0) > 0 && (
          <>
            <div>Índice:</div>
            <div>IPCA</div>
            <div>Percentual:</div>
            <div>{(ativo.parametrosFixa.ipca ?? 0).toFixed(2)}%</div>
            <div>Taxa IPCA usada:</div>
            <div>{(ativo.parametrosFixa.ipcaUsado ?? 0) .toFixed(4)}% a.d.</div>
          </>
        )}
      </>
    )}
  </>
)}

        {/* Renda Variável */}
        {isRendaVariavel && (
          <>
            <div>Quantidade:</div>
            <div>{(ativo as RendaVariavelAtivo).quantidade.toFixed(8)}</div>

            <div>Preço médio:</div>
            <div>{formatCurrency(precoMedio)}</div>

            <div>Rendimento:</div>
            <div className={rendimentoTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(rendimentoTotal)} ({rendimentoPercentual.toFixed(2)}%)
            </div>
          </>
        )}
      </div>

      {/* Histórico de compras */}
      {isRendaVariavel && (ativo as RendaVariavelAtivo).compras?.length > 1 && (
        <div className="mt-3">
          <h4 className="font-semibold text-sm">Histórico de Compras:</h4>
          <ul className="list-disc list-inside text-xs text-gray-600">
            {(ativo as RendaVariavelAtivo).compras.map((compra, index) => (
              <li key={index}>
                {formatCurrency(compra.valor)} - {formatDate(compra.data)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-between mt-4">
        <Button onClick={() => onSell(ativo.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
          {ativo.tipo === 'rendaFixa' ? 'Resgatar' : 'Vender'}
        </Button>

        {onInformarDividendo && ativo.tipo === 'rendaVariavel' && ativo.subtipo === 'fii' && (
          <Button
            onClick={() => onInformarDividendo(ativo as RendaVariavelAtivo)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Informar Dividendo
          </Button>
        )}
      </div>
    </div>
  );
};

export default AtivoCard;
