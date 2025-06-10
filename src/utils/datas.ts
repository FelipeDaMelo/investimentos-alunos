/**
 * Formata uma data ISO ou objeto Date para o formato brasileiro: "dd/mm/aaaa hh:mm:ss"
 */
export function formatarDataHoraBr(dataIso: string | Date): string {
  const data = typeof dataIso === 'string' ? new Date(dataIso) : dataIso;

  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();

  const horas = String(data.getHours()).padStart(2, '0');
  const minutos = String(data.getMinutes()).padStart(2, '0');
  const segundos = String(data.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

/**
 * Calcula o número de dias decorridos entre duas datas (ignora hora e fuso horário).
 * @param dataInicial Data de início (string ISO ou Date)
 * @param dataFinal Data de fim (padrão: hoje)
 * @returns Número de dias completos decorridos
 */
export function diasDecorridos(dataInicial: string | Date, dataFinal: string | Date = new Date()): number {
  const inicio = new Date(dataInicial);
  const fim = new Date(dataFinal);

  // Ignora horas para evitar erros de fuso horário e arredondamento
  const inicioLocal = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const fimLocal = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());

  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.floor((fimLocal.getTime() - inicioLocal.getTime()) / msPorDia);
}