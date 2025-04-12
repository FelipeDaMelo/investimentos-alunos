// fetchValorAtual.tsx
import yahooFinance from 'yahoo-finance2';

const fetchValorAtual = async (ticker: string) => {
  try {
    // Obtendo os dados do Yahoo Finance para o ticker
    const result = await yahooFinance.quote(ticker);

    // Pegando o preço atual do ativo
    const valorAtual = result.regularMarketPrice;

    if (valorAtual) {
      return valorAtual.toFixed(2);
    } else {
      throw new Error('Valor atual não disponível');
    }
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;
