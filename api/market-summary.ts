import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BRAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Configuração BRAPI_TOKEN ausente' });
  }

  try {
    // Símbolos buscados: Ibovespa, Dólar e Bitcoin
    const symbols = ['^BVSP', 'USDBRL=X', 'BTC-BRL'];
    // Codificamos cada símbolo individualmente, mas mantemos a vírgula sem codificar
    const encodedSymbols = symbols.map(s => encodeURIComponent(s)).join(',');
    const url = `https://brapi.dev/api/quote/${encodedSymbols}?token=${token}`;
    
    const response = await fetch(url);
    const data: any = await response.json();

    if (!response.ok) {
      console.error('[API Market Summary] Brapi Error:', data);
      return res.status(response.status).json({ 
        error: 'Erro na resposta da Brapi', 
        details: data.message || data 
      });
    }

    const results = data.results || [];
    
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ error: 'Nenhum dado retornado pela Brapi' });
    }

    const summary = results.map((item: any) => ({
      symbol: item.symbol,
      name: item.shortName || item.symbol,
      price: item.regularMarketPrice || 0,
      changePercent: item.regularMarketChangePercent || 0,
    }));

    // Formatação amigável para o front
    const formatted = {
      ibov: summary.find((s: any) => s.symbol === '^BVSP'),
      dolar: summary.find((s: any) => s.symbol === 'USDBRL=X'),
      btc: summary.find((s: any) => s.symbol === 'BTC-BRL'),
    };

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('Erro crítico no sumário do mercado:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar sumário do mercado', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
