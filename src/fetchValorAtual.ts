const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string): Promise<string> => {
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

    // CDI ou SELIC
    else if (tickerCorrigido === 'CDI' || tickerCorrigido === 'SELIC') {
      valorAtual = await getTaxaSelicCDI(tickerCorrigido);
      cache.set(ticker, valorAtual);
      return valorAtual;
    }

    // Buscar valor de ações ou cripto via API
    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    if (data && data.valorAtual) {
      valorAtual = data.valorAtual;

      // Se for cripto em USD, converter para BRL
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

// Função para obter o valor da SELIC ou CDI via Banco Central
const getTaxaSelicCDI = async (tipo: string): Promise<string> => {
  try {
    let url = '';
    if (tipo === 'SELIC') {
      url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
    } else if (tipo === 'CDI') {
      url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json';
    }

    const res = await fetch(url);
    const data = await res.json();
    return data[0].valor; // Ex: "10.65"
  } catch (error) {
    console.error('Erro ao obter taxa SELIC/CDI', error);
    return 'Erro ao carregar';
  }
};

// Função para obter a cotação do dólar (USD -> BRL)
const getCotacaoDolarBRL = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    return data.rates.BRL;
  } catch (error) {
    console.error('Erro ao obter cotação do dólar para BRL', error);
    return 5.0; // fallback
  }
};

export default fetchValorAtual;
