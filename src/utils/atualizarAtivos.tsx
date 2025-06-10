// utils/atualizarAtivos.ts
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
// Importe a versão de calcularRendimentoFixa que aceita o número de dias
import calcularRendimentoFixa from '../hooks/calcularRendimentoFixa'; 
import { diasDecorridos } from './datas';

/**
 * Atualiza uma lista de ativos para a data de "hoje".
 * - Renda Fixa: Calcula o rendimento cumulativo desde a última atualização.
 * - Renda Variável: Busca o preço de mercado atual.
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
      if (ativo.tipo === 'rendaFixa') {
        // Encontra a última data em que o patrimônio foi registrado para este ativo
        const datasRegistradas = Object.keys(ativo.patrimonioPorDia || {});
        const ultimaData = datasRegistradas.sort().pop() || ativo.dataInvestimento;
        
        // Calcula os dias úteis que se passaram desde a última atualização deste ativo específico
        const diasParaRender = diasDecorridos(ultimaData, hoje);

        if (diasParaRender <= 0) {
          return ativo; // Nenhum rendimento a ser calculado, retorna o ativo como está.
        }

        // Chama a função de cálculo passando o número exato de dias a renderizar
        const novoValor = await calcularRendimentoFixa(ativo as RendaFixaAtivo, diasParaRender);
        
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