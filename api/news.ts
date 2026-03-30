import type { VercelRequest, VercelResponse } from '@vercel/node';
import Parser from 'rss-parser';

const parser = new Parser();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const feed = await parser.parseURL('https://www.infomoney.com.br/mercados/rss');
    
    // Pegar as 6 notícias mais recentes
    const news = feed.items.slice(0, 6).map(item => {
      // Formatar a data para algo legível (ex: "Há 2 horas")
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      const now = new Date();
      const diffMs = now.getTime() - pubDate.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      let timeAgo = 'Agora mesmo';
      if (diffHours >= 24) {
        timeAgo = `${Math.floor(diffHours / 24)}d atrás`;
      } else if (diffHours >= 1) {
        timeAgo = `${diffHours}h atrás`;
      } else if (diffMinutes >= 1) {
        timeAgo = `${diffMinutes}min atrás`;
      }

      return {
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        timeAgo: timeAgo
      };
    });

    return res.status(200).json(news);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return res.status(500).json({ error: 'Erro ao processar feed de notícias' });
  }
}
