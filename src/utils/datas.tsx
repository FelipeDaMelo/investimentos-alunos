// Em src/utils/datas.ts

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
 * ✅ FUNÇÃO CORRIGIDA ✅
 * Calcula o número de dias úteis entre duas datas, seguindo a regra D+1.
 * A contagem começa a partir do dia seguinte à data inicial e exclui fins de semana.
 * @param dataInicialStr A data de início no formato 'YYYY-MM-DD' ou objeto Date.
 * @param dataFinalStr A data final (opcional, padrão é hoje) no formato 'YYYY-MM-DD' ou objeto Date.
 * @returns O número de dias úteis para o cálculo do rendimento.
 */
export function diasDecorridos(dataInicialStr: string | Date, dataFinalStr: string | Date = new Date()): number {
  const d1 = new Date(dataInicialStr);
  const d2 = new Date(dataFinalStr);
  
  // Normaliza as datas para UTC meia-noite para evitar problemas com fuso horário
  const dataInicialUTC = new Date(Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate()));
  const dataFinalUTC = new Date(Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()));

  // Se a data final for no mesmo dia ou anterior, não há dias de rendimento.
  // Isso resolve o problema de render no mesmo dia do investimento.
  if (dataFinalUTC <= dataInicialUTC) {
    return 0;
  }

  let diasUteis = 0;
  const umDiaEmMs = 1000 * 60 * 60 * 24;

  // Começa a iterar a partir do dia SEGUINTE ao investimento (Regra D+1)
  let dataCorrente = new Date(dataInicialUTC.getTime() + umDiaEmMs);

  while (dataCorrente <= dataFinalUTC) {
    const diaDaSemana = dataCorrente.getUTCDay(); // 0 = Domingo, 6 = Sábado

    // getUTCDay() considera Domingo como 0 e Sábado como 6
    if (diaDaSemana !== 0 && diaDaSemana !== 6) {
      // Opcional: Aqui você poderia adicionar uma lógica para verificar feriados
      // se quisesse ser ainda mais preciso. Por enquanto, isso é suficiente.
      diasUteis++;
    }
    
    // Avança para o próximo dia
    dataCorrente = new Date(dataCorrente.getTime() + umDiaEmMs);
  }

  return diasUteis;
}

/**
 * Retorna a data de hoje no formato 'YYYY-MM-DD', zerando as horas para o início do dia.
 */
export function dataHojeLocal(): string {
  const agora = new Date();
  // Usar UTC para evitar problemas de fuso que podem mudar o dia
  const ano = agora.getUTCFullYear();
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(agora.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}