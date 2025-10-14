// Caminho: src/utils/calculateUserMetrics.ts (VERSÃO SIMPLIFICADA)

/**
 * Extrai as métricas de performance já calculadas do documento do usuário.
 * @param userData O objeto de dados do documento do usuário no Firestore.
 * @returns Um objeto com o valor total da carteira e a rentabilidade.
 */
export function calculateUserMetrics(userData: any) {
  let valorTotalAtual = 0;
  if (userData.patrimonioPorDia) {
    const datas = Object.keys(userData.patrimonioPorDia).sort();
    if (datas.length > 0) {
      const ultimaData = datas[datas.length - 1];
      valorTotalAtual = userData.patrimonioPorDia[ultimaData];
    }
  }

  let rentabilidade = 0;
  if (userData.valorCotaPorDia) {
    const datas = Object.keys(userData.valorCotaPorDia).sort();
    if (datas.length > 0) {
      const ultimaData = datas[datas.length - 1];
      const ultimaCota = userData.valorCotaPorDia[ultimaData];
      rentabilidade = (ultimaCota - 1) * 100;
    }
  }

  return {
    valorTotalAtual,
    rentabilidade,
  };
}