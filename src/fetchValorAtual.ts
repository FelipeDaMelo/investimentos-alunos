const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let valorAtual: string = 'Erro ao carregar';

    // Ações brasileiras ou BDRs da B3 (ex: ITUB4, AAPL34)
    if (/^[A-Z]{4}\d{1,2}$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }
    // Criptomoedas (ex: BTC, ETH)
    else if (/^[A-Z]{2,5}$/.test(tickerCorrigido)) {
      tickerCorrigido += '-USD';
    }

    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    if (data && data.valorAtual) {
      valorAtual = data.valorAtual;

      if (tickerCorrigido.includes('-USD')) {
        const valorEmUSD = parseFloat(valorAtual);
        const cotacaoDolarBRL = await getCotacaoDolarBRL();
        valorAtual = (valorEmUSD * cotacaoDolarBRL).toFixed(2);
      }
    }

    cache.set(ticker, valorAtual);
    return valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

const getCotacaoDolarBRL = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data.rates.BRL;
  } catch (error) {
    console.error('Erro ao obter cotação do dólar para BRL', error);
    return 5.0;
  }
};

export default fetchValorAtual;
