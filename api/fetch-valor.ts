import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;
  const token = process.env.BRAPI_TOKEN;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  const tickerUpper = ticker.trim().toUpperCase();

  try {
    let valor: number | undefined;

    // 1. LÓGICA PARA CRIPTOMOEDAS (Ex: BTC-USD)
    if (tickerUpper.endsWith('-USD')) {
      const coin = tickerUpper.replace('-USD', '');
      
      // Tentativa 1: API v2 Crypto (Especializada)
      try {
        const response = await fetch(
          `https://brapi.dev/api/v2/crypto?coin=${coin}&currency=BRL&token=${token}`
        );
        const data: any = await response.json();
        valor = data.coins?.[0]?.regularMarketPrice || data.coins?.[0]?.coinPrice;
      } catch (e) {
        console.warn(`[API] Erro na v2/crypto para ${coin}:`, e);
      }

      // Tentativa 2: Fallback para API de Quote padrão (alguns tokens Brapi suportam BTC-BRL ou BTC-USD aqui)
      if (!valor) {
        try {
          // Tenta buscar como um ticker normal (ex: BTC-USD ou BTCUSD)
          const tickerQuote = tickerUpper.replace('-', ''); // BTCUSD habitualmente funciona em algumas APIs
          const response = await fetch(
            `https://brapi.dev/api/quote/${tickerQuote}?token=${token}`
          );
          const data: any = await response.json();
          valor = data.results?.[0]?.regularMarketPrice;
        } catch (e) {
           console.warn(`[API] Erro no fallback quote para ${tickerUpper}:`, e);
        }
      }
    } 
    // 2. LÓGICA PARA AÇÕES E FIIs (Ex: PETR4.SA)
    else {
      const response = await fetch(
        `https://brapi.dev/api/quote/${encodeURIComponent(tickerUpper)}?token=${token}`
      );
      const data: any = await response.json();
      valor = data.results?.[0]?.regularMarketPrice;
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return res.status(200).json({ valorAtual: valor.toFixed(2) });
    }

    // Se chegou aqui, não encontrou o valor em nenhuma tentativa
    return res.status(404).json({ 
      error: 'Valor não disponível', 
      ticker: tickerUpper,
      message: "Ativo não encontrado na Brapi. Verifique o ticker."
    });
  } catch (error) {
    console.error("Erro crítico na API:", error);
    return res.status(500).json({ error: 'Erro interno ao buscar valor' });
  }
}