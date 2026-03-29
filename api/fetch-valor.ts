import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;
  const token = process.env.BRAPI_TOKEN;

  // 1. Validação Inicial
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  // 2. Normalização do Ticker (Ex: "BTC-USD" -> "BTC", " petr4 " -> "PETR4")
  const normalizedTicker = ticker.trim().toUpperCase().split('-')[0];

  try {
    let valor: number | undefined;
    let logo: string | undefined;
    let tipo: 'stock' | 'crypto' | undefined;

    // TENTATIVA 1: Rota de Ações/FIIs
    try {
      const quoteRes = await fetch(
        `https://brapi.dev/api/quote/${encodeURIComponent(normalizedTicker)}?token=${token}`
      );
      const quoteData = await quoteRes.json();
      const result = quoteData.results?.[0];

      if (result && typeof result.regularMarketPrice === 'number') {
        valor = result.regularMarketPrice;
        logo = result.logourl;
        tipo = 'stock';
      }
    } catch (e) {
      console.warn(`[API] Erro na rota de quote para ${normalizedTicker}:`, e);
    }

    // TENTATIVA 2 (Fallback): Rota de Criptomoedas
    if (!valor) {
      try {
        const cryptoRes = await fetch(
          `https://brapi.dev/api/v2/crypto?coin=${normalizedTicker}&currency=BRL&token=${token}`
        );
        const cryptoData = await cryptoRes.json();
        const coin = cryptoData.coins?.[0];

        if (coin && typeof coin.regularMarketPrice === 'number') {
          valor = coin.regularMarketPrice;
          // BRApi v2 usa coinImageUrl, mas checamos fallbacks por segurança
          logo = coin.coinImageUrl || coin.coinIcon || coin.logo;
          tipo = 'crypto';
        }
      } catch (e) {
        console.warn(`[API] Erro na rota de crypto para ${normalizedTicker}:`, e);
      }
    }

    // 3. Resposta de Sucesso
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return res.status(200).json({
        valorAtual: valor.toFixed(2),
        logo: logo,
        tipo: tipo
      });
    }

    // 4. Falha Geral
    return res.status(404).json({
      error: 'Ativo não encontrado',
      ticker: normalizedTicker,
      message: "Não foi possível encontrar este ativo como Ação ou Criptomoeda."
    });

  } catch (error) {
    console.error("Erro crítico na Serverless Function:", error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}