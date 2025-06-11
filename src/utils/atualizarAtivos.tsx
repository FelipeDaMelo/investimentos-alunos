// Caminho: src/utils/atualizarAtivos.ts
// ✅ VERSÃO FINAL CORRIGIDA

import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
// Importa a nova função com o nome corrigido
import calcularRendimentoTotalFixa from '../hooks/calcularRendimentoFixa';

/**
 * Atualiza uma lista de ativos para a data de "hoje".
 * A lógica agora sempre recalcula o valor total a partir da data de início.
 * @param ativos A lista de ativos a ser atualizada.
 * @param hoje A data para a qual os ativos devem ser atualizados (formato 'YYYY-MM-DD').
 * @returns Uma promessa com a nova lista de ativos atualizados.
 */
export async function atualizarAtivos(
  ativos: Ativo[],
  hoje: string
): Promise<Ativo[]> {
  return await Promise.all(
    ativos.map(async (ativo) => {
      
      // --- LÓGICA PARA RENDA FIXA ---
      if (ativo.tipo === 'rendaFixa') {
        
        // Simplesmente chama a nova função que contém toda a lógica.
        const novoValor = await calcularRendimentoTotalFixa(ativo as RendaFixaAtivo, hoje);
        
        return {
          ...ativo,
          valorAtual: novoValor,
          patrimonioPorDia: {
            ...ativo.patrimonioPorDia,
            [hoje]: novoValor,
          },
        };

      } else { // Renda Variável
        const ativoVar = ativo as RendaVariavelAtivo;
        try {
          const valorAtualString = await fetchValorAtual(ativoVar.tickerFormatado);
          const valorAtual = parseFloat(valorAtualString);
          
          if (isNaN(valorAtual)) { // Proteção caso a API retorne algo inesperado
            console.warn(`Valor inválido recebido para ${ativoVar.tickerFormatado}. Mantendo valor anterior.`);
            return ativo;
          }

          const patrimonio = valorAtual * ativoVar.quantidade;
          return {
            ...ativo,
            valorAtual,
            patrimonioPorDia: {
              ...ativo.patrimonioPorDia,
              [hoje]: patrimonio,
            },
          };
        } catch (error) {
          console.warn(`Não foi possível atualizar ${ativoVar.tickerFormatado}. Mantendo valor anterior.`, error);
          return ativo;
        }
      }
    })
  );
}