import axios from 'axios';

const API_KEY = 'cvt62nhr01qhup0ug76gcvt62nhr01qhup0ug770'; // Sua chave da API Finnhub

export const fetchValorAtual = async (ticker: string) => {
  const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data) {
      return `US$ ${data.c.toFixed(2)}`; // Retorna o preço atual
    } else {
      throw new Error('Dados não encontrados.');
    }
  } catch (error) {
    console.error('Erro ao buscar valor do ativo:', error);
    return 'Erro ao carregar';
  }
};
