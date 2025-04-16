// src/fetchValorAtual.ts
const fetchValorAtual = async (ticker: string) => {
  try {
    let tickerCorrigido = ticker.trim().toUpperCase();

    // Se for formato de ação brasileira tipo PETR4, adiciona .SA
    if (/^[A-Z]{4}\d$/.test(tickerCorrigido)) {
      tickerCorrigido += '.SA';
    }

    // Se for uma possível criptomoeda, adiciona -USD
    if (!tickerCorrigido.includes('.') && !tickerCorrigido.includes('-')) {
      tickerCorrigido += '-USD';
    }

    const res = await fetch(`/api/fetch-valor?ticker=${tickerCorrigido}`);
    const data = await res.json();

    return data.valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;
