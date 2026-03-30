import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoTotalFixa from '../hooks/calcularRendimentoFixa';

/**
 * Utilitário anti-throttle de API para atualizar múltiplos alunos simultaneamente.
 * Ele mapeia apenas ativos únicos de Renda Variável e recalcula a Fixa na raiz.
 */

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function batchAtualizarAtivos(usersToUpdate: any[], hoje: string): Promise<any[]> {
  // 1. Dicionário Único de Tickers para prevenir rate-limiting da API
  const uniqueAssets = new Map<string, 'stock' | 'crypto'>();
  
  usersToUpdate.forEach(user => {
    (user.ativos || []).forEach((ativo: Ativo) => {
      if (ativo.tipo === 'rendaVariavel') {
        const ativoVar = ativo as RendaVariavelAtivo;
        if (ativoVar.tickerFormatado) {
          // Mapeia o ticker para o seu tipo para garantir busca correta
          uniqueAssets.set(ativoVar.tickerFormatado, ativoVar.subtipo === 'criptomoeda' ? 'crypto' : 'stock');
        }
      }
    });
  });

  // 2. Resolver Cotações (Sequential safe fetching)
  const priceMap: Record<string, number> = {};
  const logoMap: Record<string, string | undefined> = {};
  
  for (const [ticker, type] of Array.from(uniqueAssets.entries())) {
    try {
      const { valor: valorStr, logo } = await fetchValorAtual(ticker, type);
      const valor = parseFloat(valorStr);
      if (!isNaN(valor) && valor > 0) {
        priceMap[ticker] = valor;
        logoMap[ticker] = logo;
      }
    } catch(e) {
      console.warn(`[Batch Update] Erro resolvendo ${ticker}`, e);
    }
    // Delay de 200ms por ticket para não ser banido da B3
    await delay(200); 
  }

  // 3. Aplicar cotações e recalcular rendimentos fixos
  const updatedUsers = await Promise.all(usersToUpdate.map(async (user) => {
    const novosAtivos = await Promise.all((user.ativos || []).map(async (ativo: Ativo) => {
      
      if (ativo.tipo === 'rendaFixa') {
        const novoValor = await calcularRendimentoTotalFixa(ativo as RendaFixaAtivo, hoje);
        return {
          ...ativo,
          valorAtual: novoValor,
          patrimonioPorDia: {
            ...ativo.patrimonioPorDia,
            [hoje]: novoValor,
          },
        };
      } else { 
        // Renda Variável
        const ativoVar = ativo as RendaVariavelAtivo;
        // Usa o preço novo. Se a API falhou para aquele ticket específico, mantém o preço antigo para não destruir o patrimônio
        const precoNovo = priceMap[ativoVar.tickerFormatado] || ativoVar.valorAtual; 
        const logoNovo = logoMap[ativoVar.tickerFormatado] || ativoVar.logo;
        const patrimonio = precoNovo * ativoVar.quantidade;
        
        return {
          ...ativo,
          valorAtual: precoNovo,
          logo: logoNovo,
          patrimonioPorDia: {
            ...ativo.patrimonioPorDia,
            [hoje]: patrimonio,
          },
        };
      }
    }));

    return {
      ...user,
      ativos: novosAtivos
    };
  }));

  return updatedUsers;
}
