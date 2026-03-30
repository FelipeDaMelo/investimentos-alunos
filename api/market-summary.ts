import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BRAPI_TOKEN;

  try {
    // Buscando Ibovespa, Dólar e Bitcoin
    const response = await fetch(
      `https://brapi.dev/api/quote/%5EBVSP,USDBRL=X,BTC-BRL?token=${token}`
    );
    
    if (!response.ok) {
      throw new Error('Erro na resposta da Brapi');
    }

    const data = await response.json();
    const results = data.results || [];

    const summary = results.map((item: any) => ({
      symbol: item.symbol,
      name: item.shortName || item.symbol,
      price: item.regularMarketPrice,
      changePercent: item.regularMarketChangePercent,
    }));

    // Formatação amigável para o front
    const formatted = {
      ibov: summary.find((s: any) => s.symbol === '^BVSP'),
      dolar: summary.find((s: any) => s.symbol === 'USDBRL=X'),
      btc: summary.find((s: any) => s.symbol === 'BTC-BRL'),
    };

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Erro ao buscar sumário do mercado:', error);
    return res.status(500).json({ error: 'Erro ao processar sumário do mercado' });
  }
}
