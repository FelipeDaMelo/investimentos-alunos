const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let valorAtual: string = 'Erro ao carregar';

    // Se for um ticker de ação brasileira (4 letras + 1 número), adicionar ".SA" (ex: ITUB4 -> ITUB4.SA)
    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }
    // Para ações internacionais, como GOOGL, AAPL, TSLA, adiciona-se o BDR correspondente no Brasil
    else if (/^[A-Z]{4}$/.test(tickerCorrigido)) {
      tickerCorrigido += '34';  // Isso é uma suposição, e dependendo da ação, pode ser outro código
    }
    // Se for uma criptomoeda (2 a 5 letras), adiciona "-USD"
    else if (/^[A-Z]{2,5}$/.test(tickerCorrigido)) {
      tickerCorrigido += '-USD';
      // Buscar o valor em USD primeiro
      const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
      const data = await res.json();
      
      if (data && data.valorAtual) {
        const valorEmUSD = parseFloat(data.valorAtual);

        // Obter a cotação do dólar para real (você pode usar uma API para isso, como o Yahoo ou uma API de câmbio)
        const cotacaoDolarBRL = await getCotacaoDolarBRL();  // Função fictícia para obter a cotação
        valorAtual = (valorEmUSD * cotacaoDolarBRL).toFixed(2);  // Converte o valor de USD para BRL
      }
    }

    cache.set(ticker, valorAtual);
    return valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

// Função fictícia para pegar a cotação do dólar para reais
const getCotacaoDolarBRL = async (): Promise<number> => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD'); // Exemplo de API de câmbio
    const data = await res.json();
    return data.rates.BRL; // Retorna a cotação do USD para BRL
  } catch (error) {
    console.error('Erro ao obter cotação do dólar para BRL', error);
    return 5.0;  // Valor padrão de cotação se a API falhar
  }
};

export default fetchValorAtual;
