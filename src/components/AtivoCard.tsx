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

  const rendimentoPercentual = isRendaVariavel && precoMedio > 0
    ? (((ativo as RendaVariavelAtivo).valorAtual / precoMedio) - 1) * 100
    : 0;

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
   className={`p-4 rounded-xl shadow-lg border-l-4 
             transform hover:-translate-y-1 hover:shadow-2xl 
             transition-all duration-300 ease-out 
             ${cardBgClass} `} // ✅ Agora ${cardBgClass} é a única fonte da cor de fundo
  style={{ borderColor: cor }}
>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{ativo.nome}</h3>
            <span className={`text-xs px-2 py-1 rounded capitalize font-medium
  ${ativo.tipo === 'rendaFixa' ? 'bg-gray-100 text-gray-700' :
    ativo.subtipo === 'acao' ? 'bg-blue-100 text-blue-800' :
    ativo.subtipo === 'fii' ? 'bg-purple-100 text-purple-800' :
    'bg-yellow-100 text-yellow-800'}`}>
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

          {ativo.tipo === 'rendaFixa' && (
            <>
<div>Rendimento:</div>
<div className="text-sm font-semibold text-green-700 bg-green-100 rounded px-2 py-1">
  {formatCurrency(ativo.valorAtual - ativo.valorInvestido)} (▲ {(100 * (ativo.valorAtual - ativo.valorInvestido) / ativo.valorInvestido).toFixed(2)}%)
</div>


              <div>Tipo de Rendimento:</div>
              <div className="capitalize">{ativo.categoriaFixa}</div>

              {/* Prefixada */}
              {ativo.categoriaFixa === 'prefixada' && (
                <>
                  <div>Taxa Prefixada (a.a):</div>
                  <div>{(ativo.parametrosFixa.taxaPrefixada ?? 0).toFixed(2)}%</div>
                </>
              )}

              {/* Pós-fixada */}
              {ativo.categoriaFixa === 'posFixada' && (
                <>
                  {(ativo.parametrosFixa.percentualCDI ?? 0) > 0 && (
                    <>
                      <div>Percentual:</div>
                      <div>{(ativo.parametrosFixa.percentualCDI ?? 0).toFixed(2)}%  CDI</div>
                    </>
                  )}
                  {(ativo.parametrosFixa.percentualSELIC ?? 0) > 0 && (
                    <>
                      <div>Percentual:</div>
                      <div>{(ativo.parametrosFixa.percentualSELIC ?? 0).toFixed(2)}% SELIC</div>
                    </>
                  )}
                </>
              )}

              {/* Híbrida */}
              {ativo.categoriaFixa === 'hibrida' && (
                <>
                  <div>Taxa Prefixada:</div>
                  <div>{(ativo.parametrosFixa.taxaPrefixada ?? 0).toFixed(2)}%</div>
                 {(ativo.parametrosFixa.ipca ?? 0) > 0 && (
                    <>
                      <div>Percentual:</div>
                      <div>{(ativo.parametrosFixa.ipca ?? 0).toFixed(2)}% IPCA</div>

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
<div
  className={`
    text-sm font-semibold rounded px-2 py-1
    ${rendimentoTotal >= 0
      ? 'text-green-700 bg-green-100'
      : 'text-red-700 bg-red-100'}
  `}
>
  {formatCurrency(rendimentoTotal)} ({rendimentoTotal >= 0 ? '▲' : '▼'} {Math.abs(rendimentoPercentual).toFixed(2)}%)
</div>
            </>
          )}
        </div>

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
      </div>

      <div className="flex justify-between mt-auto pt-4">
        <Button onClick={() => onSell(ativo.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
          {ativo.tipo === 'rendaFixa'
            ? <><BadgeDollarSign className="w-5 h-4.5 inline-block mr-1" /> Resgatar</>
            : <><ShoppingCart className="w-5 h-4.5 inline-block mr-1" /> Vender</>}
        </Button>

        {onInformarDividendo && ativo.tipo === 'rendaVariavel' && ativo.subtipo === 'fii' && (
          <Button
            onClick={onInformarDividendo} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <HandCoins className="w-5 h-4.5 inline-block mr-1" /> Informar Dividendo
          </Button>
        )}
      </div>
    </div>
  );
};

export default AtivoCard;
