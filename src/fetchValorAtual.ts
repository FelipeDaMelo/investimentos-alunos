// src/fetchValorAtual.tsx
const cache = new Map<string, string>();

// Função auxiliar para pegar a cotação do dólar
const fetchCotacaoDolar = async (): Promise<number> => {
  const res = await fetch('/api/fetch-valor?ticker=USDBRL=X');
  const data = await res.json();
  return parseFloat(data.valorAtual);
};

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let isCrypto = false;

    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }

    if (!tickerCorrigido.includes('.') && !tickerCorrigido.includes('-')) {
      tickerCorrigido += '-USD';
      isCrypto = true;
    }

    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    let valor = parseFloat(data.valorAtual);

    if (isCrypto) {
      const cotacaoDolar = await fetchCotacaoDolar();
      valor *= cotacaoDolar;
    }

    const valorFormatado = valor.toFixed(2);
    cache.set(ticker, valorFormatado);
    return valorFormatado;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;
