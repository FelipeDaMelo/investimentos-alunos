import axios from 'axios';
import * as cheerio from 'cheerio';

const fetchDividendoFII = async (ticker: string): Promise<number> => {
  try {
    const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
      
    });
    console.log('HTML recebido:', data);
    const $ = cheerio.load(data);
    const texto = $('strong:contains("Último Rendimento")').parent().text();
    const match = texto.match(/R\$ ?([\d,]+)/);

    if (match && match[1]) {
      const valorStr = match[1].replace(',', '.');
      const valor = parseFloat(valorStr);
      return isNaN(valor) ? 0 : valor;
    }

    return 0;
  } catch (error) {
    console.error('Erro ao buscar dividendo via FundsExplorer:', error);
    return 0;
  }
};

export default fetchDividendoFII;
