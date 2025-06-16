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
      const cdiDiario = parseFloat(await fetchValorAtual('CDI'));
      taxaDiariaIndexada = (cdiDiario/100) * (percentualCDI / 100);
    } else if (percentualSELIC > 0) {
      const selicDiaria = parseFloat(await fetchValorAtual('SELIC'));
      taxaDiariaIndexada = (selicDiaria/100) * (percentualSELIC / 100);
    }
    
    // Aplica a taxa diária para o período 't' de forma exponencial.
    return principal * Math.pow(1 + taxaDiariaIndexada, t);
  }

 // --- Lógica para tipo Híbrido ---
if (ativo.categoriaFixa === 'hibrida') {
   const { taxaPrefixada = 0, ipcaUsado = 0 } = ativo.parametrosFixa || {};
    
    // 1. Calcula a taxa diária da parte PRÉ-fixada ("X%")
    const taxaDiariaPre = Math.pow(1 + taxaPrefixada / 100, 1 / 252) - 1;

    // 2. Busca a taxa MENSAL do IPCA e converte para diária
    const taxaDiariaIpca = ipcaUsado / 100;

    // 3. Compõe as duas taxas para encontrar a taxa total diária.
    //    Esta linha é a implementação de (1+a)*(1+b)-1
    const taxaTotalDiaria = (1 + taxaDiariaPre) * (1 + taxaDiariaIpca) - 1;

    // 4. Aplica a taxa total para o período.
    return principal * Math.pow(1 + taxaTotalDiaria, t);
}

  // Se nenhum caso corresponder, retorna o valor principal sem alterações.
  return principal;
};

// Renomeie a exportação para refletir a nova lógica
export default calcularRendimentoTotalFixa;