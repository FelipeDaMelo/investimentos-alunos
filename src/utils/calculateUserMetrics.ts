// Caminho: src/utils/calculateUserMetrics.ts (VERSÃO ATUALIZADA PARA ROI)

/**
 * Calcula as métricas de performance de um usuário com base na lógica ROI (Retorno sobre o Investimento),
 * replicando o cálculo da MainPage para consistência em toda a aplicação.
 *
 * @param userData O objeto de dados completo do documento do usuário no Firestore.
 * @returns Um objeto com o valor total da carteira e a rentabilidade ROI.
 */
export function calculateUserMetrics(userData: any) {
  // =================================================================================
  // LÓGICA 1: CALCULAR O TOTAL APORTADO (TOTAL DE DEPÓSITOS)
  // Esta lógica é idêntica ao hook `useMemo` para `totalAportado` em MainPage.tsx
  // =================================================================================
  const totalAportado = (userData.historico || [])
    .filter((registro: any) => registro.tipo === 'deposito')
    .reduce((soma: number, deposito: any) => soma + (deposito.valor || 0), 0);

  // =================================================================================
  // LÓGICA 2: ENCONTRAR O VALOR TOTAL ATUAL DA CARTEIRA
  // Esta lógica busca o último valor salvo no histórico de património.
  // =================================================================================
  let valorTotalAtual = 0;
  if (userData.patrimonioPorDia) {
    // Ordena as datas (chaves do objeto) para encontrar a mais recente
    const datas = Object.keys(userData.patrimonioPorDia).sort();
    if (datas.length > 0) {
      const ultimaData = datas[datas.length - 1];
      valorTotalAtual = userData.patrimonioPorDia[ultimaData];
    }
  }

  // =================================================================================
  // LÓGICA 3: CALCULAR A RENTABILIDADE (ROI)
  // Esta lógica é idêntica ao hook `useMemo` para `variacaoPercentual` em MainPage.tsx
  // =================================================================================
  let rentabilidade = 0;
  // Apenas calcula a rentabilidade se houver algum valor aportado para evitar divisão por zero.
  if (totalAportado > 0) {
    const ganhoReal = valorTotalAtual - totalAportado;
    rentabilidade = (ganhoReal / totalAportado) * 100;
  }

  return {
    valorTotalAtual,
    rentabilidade, // Este valor agora representa o ROI (ex: 2.04%)
  };
}