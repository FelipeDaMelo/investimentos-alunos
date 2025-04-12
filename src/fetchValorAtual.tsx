// fetchValorAtual.ts
const fetchValorAtual = async (ticker: string): Promise<string> => {
  try {
    const res = await fetch(`/api/fetch-valor?ticker=${ticker}`);
    const data = await res.json();

    if (res.ok && data.valorAtual) {
      return `R$ ${data.valorAtual}`;
    }

    return 'Valor indisponível';
  } catch (error) {
    console.error('Erro ao buscar valor:', error);
    return 'Erro ao carregar';
  }
};

export default fetchValorAtual;
