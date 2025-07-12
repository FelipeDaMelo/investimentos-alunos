// ✅ ativoHelpers.ts (versão atualizada e completa)
import { RendaFixaAtivo, RendaVariavelAtivo, Compra, Ativo } from '../types/Ativo';
// Ajustei o import para ser de um arquivo de tipos, que é uma prática melhor
import { RegistroHistorico } from '../hooks/RegistroHistorico'; 

export const criarAtivoFixa = (
  dados: Omit<RendaFixaAtivo, 'id' | 'valorAtual' | 'patrimonioPorDia' | 'tipo'>
): RendaFixaAtivo => ({
  id: Date.now().toString(),
  valorAtual: dados.valorInvestido,
  patrimonioPorDia: 
  { [new Date().toISOString().split('T')[0]]: dados.valorInvestido },
  ...dados,
  tipo: 'rendaFixa'
});

// Sua função criarAtivoVariavel está um pouco diferente do que eu esperava,
// parece que ela já modifica o array de ativos. Vou mantê-la como está por enquanto.
export const criarAtivoVariavel = (
  novo: Omit<RendaVariavelAtivo, 'id' | 'valorAtual' | 'patrimonioPorDia' | 'tipo' | 'compras'>,
  ativos: RendaVariavelAtivo[]
): RendaVariavelAtivo[] => {
  const hoje = new Date().toISOString().split('T')[0];
  const novaCompra: Compra = {
    valor: novo.valorInvestido,
    data: novo.dataInvestimento
  };

  const indiceExistente = ativos.findIndex(a => a.tickerFormatado === novo.tickerFormatado);

  if (indiceExistente !== -1) {
    const atual = ativos[indiceExistente];
    const novaQuantidade = atual.quantidade + novo.quantidade;
    const novoValorInvestido = atual.valorInvestido + novo.valorInvestido;
    const novoPrecoMedio = novoValorInvestido / novaQuantidade;

    const atualizado: RendaVariavelAtivo = {
      ...atual,
      quantidade: novaQuantidade,
      valorInvestido: novoValorInvestido,
      precoMedio: novoPrecoMedio,
      valorAtual: novaQuantidade * novo.precoMedio,
      dataInvestimento: novo.dataInvestimento,
      compras: [...atual.compras, novaCompra],
      patrimonioPorDia: {
        ...atual.patrimonioPorDia,
        [hoje]: novaQuantidade * novo.precoMedio
      }
    };

    const copia = [...ativos];
    copia[indiceExistente] = atualizado;
    return copia;
  }

  const novoAtivo: RendaVariavelAtivo = {
    ...novo,
    id: Date.now().toString(),
    tipo: 'rendaVariavel',
    precoMedio: novo.precoMedio,
    valorAtual: novo.quantidade * novo.precoMedio,
    patrimonioPorDia: { [hoje]: novo.quantidade * novo.precoMedio },
    compras: [novaCompra]
  };

  return [...ativos, novoAtivo];
};


/**
 * ✅ NOVA FUNÇÃO
 * Calcula o saldo disponível para Renda Fixa a partir do histórico de transações.
 */
export function calcularSaldoFixa(historico: RegistroHistorico[]): number {
  const saldo = historico.reduce((acc, registro) => {
    switch (registro.tipo) {
      case 'deposito':
        return registro.destino === 'fixa' ? acc + registro.valor : acc;
      
      case 'compra':
        return registro.categoria === 'rendaFixa' ? acc - registro.valor : acc;

      case 'venda':
        // Usa o valor LÍQUIDO do resgate de Renda Fixa
        return registro.categoria === 'rendaFixa' ? acc + (registro.valorLiquido ?? 0) : acc;

      case 'transferencia':
        if (registro.destino === 'fixa') return acc + registro.valor;
        if (registro.destino === 'variavel') return acc - registro.valor; // Sai da Fixa
        return acc;

      default:
        return acc;
    }
  }, 0);
  
  return parseFloat(saldo.toFixed(2));
}

/**
 * ✅ FUNÇÃO ATUALIZADA (com switch para clareza)
 * Calcula o saldo disponível em renda variável com base no histórico completo de transações.
 */
export function calcularSaldoVariavel(historico: RegistroHistorico[]): number {
  const saldo = historico.reduce((acc, registro) => {
    switch (registro.tipo) {
      case 'deposito':
        return registro.destino === 'variavel' ? acc + registro.valor : acc;
      
      case 'compra':
        return registro.categoria === 'rendaVariavel' ? acc - registro.valor : acc;

      case 'venda':
        return registro.categoria === 'rendaVariavel' ? acc + registro.valor : acc;

      case 'dividendo':
        return acc + registro.valor;
      
      case 'transferencia':
        if (registro.destino === 'variavel') return acc + registro.valor;
        if (registro.destino === 'fixa') return acc - registro.valor; // Sai da Variável
        return acc;

      case 'ir':
        // O imposto sobre RV deduz do saldo de RV.
        return registro.categoria === 'rendaVariavel' ? acc - registro.valor : acc; 
        
      default:
        return acc;
    }
  }, 0);

  return parseFloat(saldo.toFixed(2));
}