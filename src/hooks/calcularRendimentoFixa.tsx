// Caminho: src/hooks/calcularRendimentoFixa.tsx
// ✅ VERSÃO FINAL CORRIGIDA

import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo } from '../types/Ativo';
import { diasDecorridos } from '../utils/datas'; // Importa a função de calcular dias

/**
 * Calcula o VALOR TOTAL de um ativo de Renda Fixa em uma data específica,
 * partindo sempre do valor e data de investimento originais.
 * @param ativo O objeto do ativo de renda fixa.
 * @param dataDeHoje A data para a qual o valor deve ser calculado (ex: '2025-06-11').
 * @returns O novo valor total do ativo, sem arredondamentos intermediários.
 */
const calcularRendimentoTotalFixa = async (
  ativo: RendaFixaAtivo,
  dataDeHoje: string
): Promise<number> => {

  // 1. Usa a função diasDecorridos para encontrar 't' (dias úteis de rendimento).
  const t = diasDecorridos(ativo.dataInvestimento, dataDeHoje);

  // 2. Define o Principal como o valor ORIGINAL do investimento.
  const principal = ativo.valorInvestido;

  // Se não há dias para renderizar, o valor atual é o valor investido.
  if (t <= 0) {
    return principal;
  }

  // --- Lógica para tipo Pré-fixado ---
  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const taxaAnual = ativo.parametrosFixa.taxaPrefixada;
    
    // Aplica a fórmula de juros compostos para o período total.
    const valorFinal = principal * Math.pow(1 + taxaAnual / 100, t / 252);
    
    return valorFinal;
  }

  // --- Lógica para tipo Pós-fixado ---
  if (ativo.categoriaFixa === 'posFixada') {
    const { percentualCDI = 0, percentualSELIC = 0 } = ativo.parametrosFixa || {};
    let taxaDiariaIndexada = 0;

    if (percentualCDI > 0) {
      const cdiAnual = parseFloat(await fetchValorAtual('CDI'));
      const cdiDiario = Math.pow(1 + cdiAnual / 100, 1 / 252) - 1;
      taxaDiariaIndexada = cdiDiario * (percentualCDI / 100);
    } else if (percentualSELIC > 0) {
      const selicAnual = parseFloat(await fetchValorAtual('SELIC'));
      const selicDiaria = Math.pow(1 + selicAnual / 100, 1 / 252) - 1;
      taxaDiariaIndexada = selicDiaria * (percentualSELIC / 100);
    }
    
    // Aplica a taxa diária para o período 't' de forma exponencial.
    return principal * Math.pow(1 + taxaDiariaIndexada, t);
  }

  // --- Lógica para tipo Híbrido ---
  if (ativo.categoriaFixa === 'hibrida') {
    const { taxaPrefixada = 0, ipca = 0 } = ativo.parametrosFixa || {};

    // Parte 1: Rendimento da taxa pré-fixada (juros real)
    const montantePrefixado = principal * Math.pow(1 + taxaPrefixada / 100, t / 252);

    // Parte 2: Correção pela inflação (IPCA)
    const ipcaMensal = parseFloat(await fetchValorAtual('IPCA'));
    // Aprox. 21 dias úteis em um mês.
    const ipcaDiarioAprox = Math.pow(1 + ipcaMensal / 100, 1 / 21) - 1; 

    // Aplica a correção do IPCA sobre o valor já corrigido pela taxa pré-fixada.
    const valorFinal = montantePrefixado * Math.pow(1 + ipcaDiarioAprox, t);

    return valorFinal;
  }

  // Se nenhum caso corresponder, retorna o valor principal sem alterações.
  return principal;
};

// Renomeie a exportação para refletir a nova lógica
export default calcularRendimentoTotalFixa;