// api/fetch-valor.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;

  // Validação do ticker
  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  try {
    const result = await yahooFinance.quote(ticker);
    const valorAtual = result.regularMarketPrice;

    if (typeof valorAtual === 'number') {
      res.status(200).json({ valorAtual: valorAtual.toFixed(2) });
    } else {
      res.status(404).json({ error: 'Valor atual não disponível' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar valor do ativo' });
  }
}
