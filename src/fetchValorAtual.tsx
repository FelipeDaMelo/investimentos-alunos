const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let valorAtual: string = 'Erro ao carregar';

    // Casos especiais para taxas do Banco Central
    if (tickerCorrigido === 'SELIC') {
      const valor = await fetchTaxaBCB(11);
      valorAtual = valor !== null ? valor.toFixed(5) : 'Erro';
    } else if (tickerCorrigido === 'CDI') {
      const valor = await fetchTaxaBCB(12);
      valorAtual = valor !== null ? valor.toFixed(5) : 'Erro';
    } else if (tickerCorrigido === 'IPCA') {
      const valorMensal = await fetchTaxaBCB(433);
const taxaDiaria = valorMensal !== null
  ? (((Math.pow(1 + valorMensal / 100, 1 / 21)) - 1) * 100).toFixed(5)
  : 'Erro';
valorAtual = taxaDiaria;
    } else {
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
    }

    cache.set(ticker, valorAtual);
    return valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

const fetchTaxaBCB = async (codigoSerie: number): Promise<number | null> => {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados/ultimos/1?formato=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.length > 0) {
      return parseFloat(data[0].valor.replace(',', '.'));
    }
    return null;
  } catch (error) {
    console.error(`Erro ao buscar série BCB ${codigoSerie}:`, error);
    return null;
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
