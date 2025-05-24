const fetchDividendoFII = async (ticker: string): Promise<number> => {
  try {
    const res = await fetch(`/api/fetch-dividendo-fii?ticker=${ticker}`);
    const data = await res.json();
    return typeof data.dividendo === 'number' ? data.dividendo : 0;
  } catch (err) {
    console.error('Erro ao buscar dividendo:', err);
    return 0;
  }
};
