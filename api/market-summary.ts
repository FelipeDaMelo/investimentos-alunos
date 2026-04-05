import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BRAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Configuração BRAPI_TOKEN ausente' });
  }

  try {
    // 1. Buscamos Ibovespa e Bitcoin (Brapi) + Dólar (BCB)
    const [ibovRes, btcRes, dolarRes] = await Promise.all([
      fetch(`https://brapi.dev/api/quote/^BVSP?token=${token}`),
      fetch(`https://brapi.dev/api/quote/BTC-USD?token=${token}`),
      fetch(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.10813/dados/ultimos/2?formato=json`) 
    ]);

    const ibovData: any = await ibovRes.json();
    const btcData: any = await btcRes.json();
    const dolarData: any = await dolarRes.json();

    // 2. Extração Ibovespa
    const ibovResult = ibovData.results?.[0] || {};
    
    // 3. Extração Dólar (BACEN PTAX Venda - Série 10813)
    let dolarPrice = 0;
    let dolarChange = 0;
    if (dolarData && dolarData.length >= 1) {
      dolarPrice = parseFloat(dolarData[dolarData.length - 1].valor.replace(',', '.'));
      if (dolarData.length >= 2) {
        const previous = parseFloat(dolarData[dolarData.length - 2].valor.replace(',', '.'));
        dolarChange = ((dolarPrice - previous) / previous) * 100;
      }
    }

    // 4. Extração Bitcoin (Brapi + Conversão)
    const btcResult = btcData.results?.[0] || {};
    const btcPriceUSD = Number(btcResult.regularMarketPrice) || 0;
    const btcPriceBRL = btcPriceUSD * (dolarPrice || 5.0); // Use PTAX ou fallback de 5.0

    const formatted = {
      ibov: {
        symbol: '^BVSP',
        name: 'Ibovespa',
        price: Number(ibovResult.regularMarketPrice) || 0,
        changePercent: Number(ibovResult.regularMarketChangePercent) || 0,
      },
      dolar: {
        symbol: 'USD',
        name: 'Dólar',
        price: dolarPrice,
        changePercent: dolarChange,
      },
      btc: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: btcPriceBRL,
        changePercent: Number(btcResult.regularMarketChangePercent) || 0,
      },
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