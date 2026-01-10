// api/fetch-valor.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

type BrapiQuoteResult = {
  symbol?: string;
  regularMarketPrice?: number;
  currency?: string;
};

type BrapiQuoteResponse = {
  results?: BrapiQuoteResult[];
  error?: boolean;
  message?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  try {
    const tickerLimpo = ticker.trim().toUpperCase();

    const token = process.env.BRAPI_TOKEN; // configure na Vercel
    const url = new URL(`https://brapi.dev/api/quote/${encodeURIComponent(tickerLimpo)}`);

    if (token) url.searchParams.set('token', token);

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: 'Erro ao buscar valor do ativo',
        details: text || `HTTP ${response.status}`,
      });
    }

    const data = (await response.json()) as BrapiQuoteResponse;

    const valor = data?.results?.[0]?.regularMarketPrice;

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return res.status(200).json({ valorAtual: valor.toFixed(2) });
    }

    return res.status(404).json({
      error: 'Valor atual não disponível',
      details: data?.message || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar valor do ativo' });
  }
}
