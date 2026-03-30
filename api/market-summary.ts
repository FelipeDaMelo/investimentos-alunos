import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BRAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Configuração BRAPI_TOKEN ausente' });
  }

  try {
    // Fazemos as 3 requisições simultaneamente para os endpoints corretos da Brapi
    const [ibovRes, dolarRes, btcRes] = await Promise.all([
      fetch(`https://brapi.dev/api/quote/^BVSP?token=${token}`),
      fetch(`https://brapi.dev/api/v2/currency?currency=USD-BRL&token=${token}`),
      fetch(`https://brapi.dev/api/v2/crypto?coin=BTC&currency=BRL&token=${token}`)
    ]);

    // Extraímos os dados em JSON
    const ibovData: any = await ibovRes.json();
    const dolarData: any = await dolarRes.json();
    const btcData: any = await btcRes.json();

    // Verificação de segurança (se a Brapi retornar erro em alguma delas)
    if (!ibovRes.ok && !dolarRes.ok && !btcRes.ok) {
      return res.status(400).json({ error: 'Falha ao buscar dados na Brapi' });
    }

    // Extraindo os valores (a estrutura de resposta muda dependendo do endpoint da Brapi)
    const ibovResult = ibovData.results?.[0] || {};
    const dolarResult = dolarData.currency?.[0] || {}; // O endpoint /v2/currency retorna um array "currency"
    const btcResult = btcData.coins?.[0] || {};        // O endpoint /v2/crypto retorna um array "coins"

    // Formatação amigável padronizada para o seu frontend
    const formatted = {
      ibov: {
        symbol: '^BVSP',
        name: 'Ibovespa',
        price: ibovResult.regularMarketPrice || 0,
        changePercent: ibovResult.regularMarketChangePercent || 0,
      },
      dolar: {
        symbol: 'USD',
        name: 'Dólar',
        price: dolarResult.askPrice || dolarResult.bidPrice || 0, // Brapi usa bid/ask para moedas
        changePercent: dolarResult.pctChange || 0,
      },
      btc: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: btcResult.regularMarketPrice || 0,
        changePercent: btcResult.regularMarketChangePercent || 0,
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