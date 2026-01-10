// api/fetch-valor.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
    return res.status(400).json({ error: 'Ticker inválido ou vazio' });
  }

  try {
    // Forçamos o 'result' como 'any' para evitar o erro de 'never' no build
    const result: any = await yahooFinance.quote(ticker);
    
    // Agora o TypeScript não reclamará desta linha:
    const valorAtual = result?.regularMarketPrice;

    if (typeof valorAtual === 'number') {
      res.status(200).json({ valorAtual: valorAtual.toFixed(2) });
    } else {
      res.status(404).json({ error: 'Valor atual não disponível' });
    }
  } catch (error: any) {
    console.error(error);
    // Retornamos o erro 500, mas com a mensagem real para ajudar no debug
    res.status(500).json({ error: 'Erro ao buscar valor do ativo', message: error.message });
  }
}