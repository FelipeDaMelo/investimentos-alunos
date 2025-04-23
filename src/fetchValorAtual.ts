const cache = new Map<string, string>();

const fetchValorAtual = async (ticker: string) => {
  try {
    // Verificar se o valor já está em cache
    if (cache.has(ticker)) {
      return cache.get(ticker)!;
    }

    let tickerCorrigido = ticker.trim().toUpperCase();
    let valorAtual: string = 'Erro ao carregar';

    // Se for um ticker de ação brasileira (ex: ITUB4 -> ITUB4.SA)
    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }
    // Se for uma criptomoeda (2 a 5 letras), adicionar "-USD" para indicar que é um par de moedas com USD
    else if (/^[A-Z]{2,5}$/.test(tickerCorrigido)) {
      tickerCorrigido += '-USD';
    }

    // Buscar o valor do ativo a partir de um endpoint (por exemplo, uma API interna)
    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    // Verifique se a resposta da API contém o valor
    if (data && data.valorAtual) {
      valorAtual = data.valorAtual;

      // Se for criptomoeda, o valor retornado estará em USD, e é necessário converter para BRL
      if (tickerCorrigido.includes('-USD')) {
        const valorEmUSD = parseFloat(valorAtual);

        // Obter a cotação do dólar (você pode utilizar uma API para isso)
        const cotacaoDolarBRL = await getCotacaoDolarBRL();
        valorAtual = (valorEmUSD * cotacaoDolarBRL).toFixed(2);  // Converte o valor de USD para BRL
      }
    }

    // Armazenar o valor no cache
    cache.set(ticker, valorAtual);
    return valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

// Função para pegar a cotação do dólar para reais
const getCotacaoDolarBRL = async (): Promise<number> => {
  try {
    // Requisição para a API de câmbio
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD'); // Exemplo de API de câmbio
    const data = await res.json();
    return data.rates.BRL; // Retorna a cotação do USD para BRL
  } catch (error) {
    console.error('Erro ao obter cotação do dólar para BRL', error);
    return 5.0;  // Valor padrão de cotação se a API falhar (pode ser ajustado conforme necessário)
  }
};

export default fetchValorAtual;
