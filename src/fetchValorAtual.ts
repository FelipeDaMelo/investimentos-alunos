const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let valorAtual: string = 'Erro ao carregar';

    // 1. Taxas do Banco Central
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
    } 
    // 2. Ativos de Renda Variável (Ações, FIIs, Criptos)
    else {
      if (/^[A-Z]{4}\d{1,2}$/.test(tickerCorrigido)) {
        tickerCorrigido += '.SA';
      } else if (/^[A-Z]{2,5}$/.test(tickerCorrigido)) {
        tickerCorrigido += '-USD';
      }
      
      const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
      const data = await res.json();

      if (data && data.valorAtual) {
        // A API agora já entrega tudo pronto em Reais (BRL)
        valorAtual = data.valorAtual;
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

// getCotacaoDolarBRL foi removida pois não é mais necessária!

export default fetchValorAtual;