const cache = new Map<string, string>();

const getCotacaoDolarBRL = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data.rates.BRL;
  } catch (error) {
    console.error('Erro ao obter cotação do dólar:', error);
    return 5.0; // fallback de segurança
  }
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
    } else if (!tickerCorrigido.includes('.') && !tickerCorrigido.includes('-')) {
      tickerCorrigido += '-USD';
      isCrypto = true;
    }

    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();
    let valor = parseFloat(data.valorAtual);

    if (isCrypto) {
      const cotacaoDolar = await getCotacaoDolarBRL();
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
