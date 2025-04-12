// fetchValorAtual.ts
import yahooFinance from 'yahoo-finance2';

const fetchValorAtual = async (ticker: string): Promise<string> => {
  try {
    const result = await yahooFinance.quote(ticker);

    const valorAtual = result.regularMarketPrice;

    if (typeof valorAtual === 'number') {
      return `R$ ${valorAtual.toFixed(2)}`;
    } else {
      console.warn(`Valor de mercado inválido para o ticker: ${ticker}`);
      return 'Valor indisponível';
    }
  } catch (error) {
    console.error(`Erro ao buscar o valor do ativo (${ticker}):`, error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;
