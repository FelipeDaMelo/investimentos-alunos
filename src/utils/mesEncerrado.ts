// src/utils/mesEncerrado.ts

/**
 * Verifica se um determinado mês (formato "YYYY-MM") já foi completamente encerrado
 * em relação à data de hoje. Usado para a lógica de Imposto de Renda.
 * Um mês é considerado "encerrado" se já estamos em um mês subsequente.
 */
export function mesEncerrado(mesAno: string, hoje = new Date()): boolean {
  const [ano, mes] = mesAno.split('-').map(Number);

  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth() + 1; // getMonth() é 0-indexed, então somamos 1

  // Se o ano atual é maior que o ano verificado, o mês já encerrou.
  if (anoHoje > ano) {
    return true;
  }

  // Se o ano é o mesmo, o mês atual (mesHoje) deve ser maior que o mês verificado.
  if (anoHoje === ano) {
    return mesHoje > mes;
  }

  // Se o ano atual é menor que o ano verificado, o mês ainda não chegou.
  return false;
}