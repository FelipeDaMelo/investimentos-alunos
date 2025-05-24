import { VercelRequest, VercelResponse } from '@vercel/node';
import puppeteer from 'puppeteer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ticker } = req.query;

  if (!ticker || typeof ticker !== 'string') {
    return res.status(400).json({ error: 'Ticker inválido' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const url = `https://www.fundsexplorer.com.br/funds/${ticker.toLowerCase()}`;
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // Esperar seletor visível (ajustar se necessário)
    await page.waitForSelector('div#indicators', { timeout: 10000 });

    const dividendo = await page.evaluate(() => {
      const allText = document.body.innerText;
      const match = allText.match(/Último Rendimento.*?R\$ ([\d,]+)/);
      if (match && match[1]) {
        return parseFloat(match[1].replace(',', '.'));
      }
      return 0;
    });

    await browser.close();
    res.status(200).json({ dividendo });
  } catch (error) {
    console.error('Erro ao buscar dividendo com puppeteer:', error);
    res.status(500).json({ error: 'Falha ao obter dividendo' });
  }
}
