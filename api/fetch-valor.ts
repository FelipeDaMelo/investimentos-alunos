import type { VercelRequest, VercelResponse } from '@vercel/node';

const getDolarRate = async (token: string): Promise<number> => {
  try {
    const res = await fetch(`https://brapi.dev/api/quote/USDBRL=X?token=${token}`);
    const data: any = await res.json();
    return data.results?.[0]?.regularMarketPrice || 5.0; // Fallback seguro
  } catch (e) {
    console.warn('[API] Erro ao buscar cotação do dólar:', e);
    return 5.0;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker, type } = req.query;
  const token = process.env.BRAPI_TOKEN;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  if (!token) {
    return res.status(500).json({ error: 'BRAPI_TOKEN não configurado' });
  }

  const tickerUpper = ticker.trim().toUpperCase();
  const baseTicker = tickerUpper.split('-')[0];

  try {
    let valor: number | undefined;
    let logo: string | undefined;
    let currency: string | undefined;
    let tipoIdentificado: 'stock' | 'crypto' | undefined;

    // SEÇÃO A: TENTATIVA COMO CRIPTOMOEDA
    const isCryptoRequested = type === 'crypto' || tickerUpper.includes('-USD') || tickerUpper.includes('-BRL');
    
    if (isCryptoRequested) {
      // 1. Tentar API v2 (Especializada - Ideal pois já permite currency=BRL)
      try {
        const cryptoRes = await fetch(
          `https://brapi.dev/api/v2/crypto?coin=${baseTicker}&currency=BRL&token=${token}`
        );
        const cryptoData = await cryptoRes.json();
        const coin = cryptoData.coins?.[0];

        if (coin && typeof coin.regularMarketPrice === 'number') {
          valor = coin.regularMarketPrice;
          logo = coin.coinImageUrl || coin.coinIcon;
          currency = 'BRL'; // V2 com currency=BRL já vem convertido
          tipoIdentificado = 'crypto';
        }
      } catch (e) {
        console.warn(`[API] Erro na v2/crypto para ${baseTicker}:`, e);
      }

      // 2. Fallback: Quote API (Geralmente retorna em USD para moedas)
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
             currency = result.currency || (suffix.includes('-USD') ? 'USD' : 'BRL');
             tipoIdentificado = 'crypto';
          }
        } catch (e) {
             console.warn(`[API] Erro no fallback quote-crypto para ${tickerUpper}:`, e);
        }
      }
    }

    // SEÇÃO B: TENTATIVA COMO AÇÃO/FII
    if (!valor) {
      try {
        const quoteRes = await fetch(
          `https://brapi.dev/api/quote/${encodeURIComponent(baseTicker)}?token=${token}`
        );
        const quoteData = await quoteRes.json();
        const result = quoteData.results?.[0];

        if (result && typeof result.regularMarketPrice === 'number') {
          valor = result.regularMarketPrice;
          logo = result.logourl;
          currency = result.currency || 'BRL';
          tipoIdentificado = 'stock';
        }
      } catch (e) {
        console.warn(`[API] Erro na rota de quote para ${baseTicker}:`, e);
      }
    }

    // 3. Conversão de Moeda (Se necessário)
    if (valor && currency === 'USD') {
      const dolarRate = await getDolarRate(token);
      valor = valor * dolarRate;
    }

    // 4. Resposta de Sucesso
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