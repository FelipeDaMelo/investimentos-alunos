import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.BRAPI_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Token da API não configurado' });
  }

  try {
    // 1. Buscar Maiores Altas (Gainers)
    // Usamos o endpoint /api/quote/list com sortBy=change e sortOrder=desc
    const gainersRes = await fetch(
      `https://brapi.dev/api/quote/list?sortBy=change&sortOrder=desc&limit=3&token=${token}`
    );
    const gainersData = await gainersRes.json();

    // 2. Buscar Maiores Baixas (Losers)
    // Usamos o endpoint /api/quote/list com sortBy=change e sortOrder=asc
    const losersRes = await fetch(
      `https://brapi.dev/api/quote/list?sortBy=change&sortOrder=asc&limit=3&token=${token}`
    );
    const losersData = await losersRes.json();

    // 3. Formatar a resposta
    const response = {
      altas: (gainersData.stocks || []).map((s: any) => ({
        stock: s.stock,
        name: s.name,
        close: s.close,
        change: s.change,
        logo: s.logo
      })),
      baixas: (losersData.stocks || []).map((s: any) => ({
        stock: s.stock,
        name: s.name,
        close: s.close,
        change: s.change,
        logo: s.logo
      }))
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Erro na API de Novidades:", error);
    return res.status(500).json({ error: 'Erro ao buscar tendências de mercado' });
  }
}
