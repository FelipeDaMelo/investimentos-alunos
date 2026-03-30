import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker, type } = req.query; // Adicionamos 'type' para maior precisão
  const token = process.env.BRAPI_TOKEN;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  // 1. Normalização
  const tickerUpper = ticker.trim().toUpperCase();
  const baseTicker = tickerUpper.split('-')[0];

  try {
    let valor: number | undefined;
    let logo: string | undefined;
    let tipoIdentificado: 'stock' | 'crypto' | undefined;

    // SEÇÃO A: TENTATIVA COMO CRIPTOMOEDA (Prioritária se type=crypto ou se o ticker tiver sufixo de moeda)
    const isCryptoRequested = type === 'crypto' || tickerUpper.includes('-USD') || tickerUpper.includes('-BRL');
    
    if (isCryptoRequested) {
      // 1. Tentar API v2 (Especializada)
      try {
        const cryptoRes = await fetch(
          `https://brapi.dev/api/v2/crypto?coin=${baseTicker}&currency=BRL&token=${token}`
        );
        const cryptoData = await cryptoRes.json();
        const coin = cryptoData.coins?.[0];

        if (coin && typeof coin.regularMarketPrice === 'number') {
          valor = coin.regularMarketPrice;
          logo = coin.coinImageUrl || coin.coinIcon;
          tipoIdentificado = 'crypto';
        }
      } catch (e) {
        console.warn(`[API] Erro na v2/crypto para ${baseTicker}:`, e);
      }

      // 2. Se falhar (ex: plano free bloqueado), tentar Quote API com sufixo completo (BTC-USD, etc)
      if (!valor) {
        try {
          const suffix = tickerUpper.includes('-') ? tickerUpper : `${baseTicker}-USD`;
          const quoteRes = await fetch(
            `https://brapi.dev/api/quote/${encodeURIComponent(suffix)}?token=${token}`
          );
          const quoteData = await quoteRes.json();
          const result = quoteData.results?.[0];
          
          if (result && typeof result.regularMarketPrice === 'number') {
             valor = result.regularMarketPrice;
             logo = result.logourl;
             tipoIdentificado = 'crypto';
          }
        } catch (e) {
             console.warn(`[API] Erro no fallback quote-crypto para ${tickerUpper}:`, e);
        }
      }
    }

    // SEÇÃO B: TENTATIVA COMO AÇÃO/FII (Se ainda não encontramos valor)
    if (!valor) {
      try {
        const quoteRes = await fetch(
          `https://brapi.dev/api/quote/${encodeURIComponent(baseTicker)}?token=${token}`
        );
        const quoteData = await quoteRes.json();
        const result = quoteData.results?.[0];

        if (result && typeof result.regularMarketPrice === 'number') {
          // Validação extra: Se for BTC/ETH e o preço for suspeito (baixo demais para a moeda real)
          // mas o usuário NÃO pediu crypto explicitamente, retornamos o que veio (pode ser o ETF).
          valor = result.regularMarketPrice;
          logo = result.logourl;
          tipoIdentificado = 'stock';
        }
      } catch (e) {
        console.warn(`[API] Erro na rota de quote para ${baseTicker}:`, e);
      }
    }

    // 3. Resposta de Sucesso
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return res.status(200).json({
        valorAtual: valor.toFixed(2),
        logo: logo,
        tipo: tipoIdentificado || 'stock'
      });
    }

    return res.status(404).json({
      error: 'Ativo não encontrado',
      ticker: baseTicker,
      message: "Não foi possível encontrar este ativo nas APIs da Brapi."
    });

  } catch (error) {
    console.error("Erro crítico na Serverless Function:", error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}