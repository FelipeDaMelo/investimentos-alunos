export default async function handler(req, res) {
    const { ticker } = req.query;
    const token = process.env.BRAPI_TOKEN;
    if (!ticker || typeof ticker !== 'string' || ticker.trim() === '') {
        return res.status(400).json({ error: 'Ticker inválido ou vazio' });
    }
    const tickerUpper = ticker.trim().toUpperCase();
    try {
        let valor;
        // 1. LÓGICA PARA CRIPTOMOEDAS (Ex: BTC-USD)
        if (tickerUpper.endsWith('-USD')) {
            const coin = tickerUpper.replace('-USD', '');
            // Buscamos direto em BRL para maior precisão (preço das exchanges brasileiras)
            const response = await fetch(`https://brapi.dev/api/v2/crypto?coin=${coin}&currency=BRL&token=${token}`);
            const data = await response.json();
            valor = data.coins?.[0]?.regularMarketPrice;
        }
        // 2. LÓGICA PARA AÇÕES E FIIs (Ex: PETR4.SA)
        else {
            const response = await fetch(`https://brapi.dev/api/quote/${encodeURIComponent(tickerUpper)}?token=${token}`);
            const data = await response.json();
            valor = data.results?.[0]?.regularMarketPrice;
        }
        if (typeof valor === 'number' && Number.isFinite(valor)) {
            return res.status(200).json({ valorAtual: valor.toFixed(2) });
        }
        return res.status(404).json({ error: 'Valor não disponível' });
    }
    catch (error) {
        console.error("Erro na API:", error);
        return res.status(500).json({ error: 'Erro ao buscar valor do ativo' });
    }
}
