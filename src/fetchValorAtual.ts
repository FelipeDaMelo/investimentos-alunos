const fetchValorAtual = async (ticker: string) => {
  try {
    const tickerCorrigido = /^[A-Z]{4}\d$/.test(ticker) ? `${ticker}.SA` : ticker;
    const res = await fetch(`/api/fetchValorAtual?ticker=${tickerCorrigido}`);
    const data = await res.json();
    return data.valorAtual;
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};
export default fetchValorAtual;
