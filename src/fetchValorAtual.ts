const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();

    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }

    if (!tickerCorrigido.includes('.') && !tickerCorrigido.includes('-')) {
      tickerCorrigido += '-USD';
    }

    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    cache.set(ticker, data.valorAtual);
    return data.valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;