// Em seu arquivo /utils/mesEncerrado.ts
export function mesEncerrado(mesAno: string, hoje = new Date()): boolean {
  const [ano, mes] = mesAno.split('-').map(Number);

  const anoHoje = hoje.getFullYear();
  const mesHoje = hoje.getMonth() + 1; // getMonth() é 0-indexed, então somamos 1

  // Se o ano atual é maior que o ano verificado, o mês já encerrou.
  if (anoHoje > ano) {
    return true;
  }

  // Se o ano é o mesmo, verificamos o mês.
  if (anoHoje === ano) {
    // Se o mês atual é maior que o mês verificado, ele encerrou.
    if (mesHoje > mes) {
      return true;
    }
    // Se é o mesmo mês, aplicamos a regra do dia 25.
    if (mesHoje === mes) {
      return hoje.getDate() > 25;
    }
  }

  // Se chegamos aqui, a data atual é anterior ao mês verificado.
  return false;
}