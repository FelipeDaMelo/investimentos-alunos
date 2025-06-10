// Caminho provável: src/hooks/calcularRendimentoFixa.tsx

import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo } from '../types/Ativo';

/**
 * Calcula o novo valor de um ativo de renda fixa aplicando juros compostos
 * sobre o seu valor atual por um determinado número de dias.
 * @param ativo O objeto do ativo de renda fixa.
 * @param diasParaCalcular O número de dias úteis de rendimento a serem aplicados.
 * @returns O novo valor total do ativo após o rendimento.
 */
const calcularRendimentoFixa = async (
  ativo: RendaFixaAtivo,
  diasParaCalcular: number
): Promise<number> => {
  const t = diasParaCalcular;
  // Os juros compostos são aplicados sobre o último valor conhecido (valorAtual).
  const principal = ativo.valorAtual;

  // Se não há dias para renderizar, retorna o valor atual sem alteração.
  if (t <= 0) {
    return principal;
  }

  // Lógica para tipo Pré-fixado
  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const taxaAnual = ativo.parametrosFixa.taxaPrefixada;
    const taxaDiaria = Math.pow(1 + taxaAnual / 100, 1 / 252) - 1;
    return principal * Math.pow(1 + taxaDiaria, t);
  }

  // Lógica para tipo Pós-fixado
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
    
    return principal * Math.pow(1 + taxaDiariaIndexada, t);
  }

  // Lógica para tipo Híbrido
  if (ativo.categoriaFixa === 'hibrida') {
    const { taxaPrefixada = 0, percentualCDI = 0, percentualSELIC = 0, ipca = 0 } = ativo.parametrosFixa || {};

    const taxaDiariaPrefixada = Math.pow(1 + taxaPrefixada / 100, 1 / 252) - 1;
    let taxaDiariaIndexada = 0;

    if (percentualCDI > 0) {
      const cdiAnual = parseFloat(await fetchValorAtual('CDI'));
      const cdiDiario = Math.pow(1 + cdiAnual / 100, 1 / 252) - 1;
      taxaDiariaIndexada = cdiDiario * (percentualCDI / 100);
    } else if (percentualSELIC > 0) {
      const selicAnual = parseFloat(await fetchValorAtual('SELIC'));
      const selicDiaria = Math.pow(1 + selicAnual / 100, 1 / 252) - 1;
      taxaDiariaIndexada = selicDiaria * (percentualSELIC / 100);
    } else if (ipca > 0) {
      // IPCA é mais complexo, geralmente divulgado mensalmente.
      // A conversão para diária é uma aproximação.
      const ipcaMensal = parseFloat(await fetchValorAtual('IPCA'));
      const ipcaDiarioAprox = Math.pow(1 + ipcaMensal / 100, 1 / 22) - 1; // 22 dias úteis no mês
      taxaDiariaIndexada = ipcaDiarioAprox * (ipca / 100);
    }

    // Para híbridos, as taxas são somadas (juros real + correção)
    const taxaTotalDiaria = (1 + taxaDiariaPrefixada) * (1 + taxaDiariaIndexada) - 1;
    return principal * Math.pow(1 + taxaTotalDiaria, t);
  }

  // Se nenhum caso corresponder, retorna o valor principal sem alterações.
  return principal;
};

export default calcularRendimentoFixa;