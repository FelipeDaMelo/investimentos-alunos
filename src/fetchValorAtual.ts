const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();

    // Ação brasileira: 4 letras + 1 número → adiciona .SA
    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }
    // Criptomoeda: só letras e comprimento ≤ 5 → adiciona -USD
    else if (/^[A-Z]{2,5}$/.test(tickerCorrigido)) {
      tickerCorrigido += '-USD';
    }
    // Ação internacional (como GOOGL, AAPL): deixa como está

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
