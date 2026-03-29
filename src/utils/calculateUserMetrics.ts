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
  // LÓGICA 3: CALCULAR A RENTABILIDADE (SISTEMA DE COTAS)
  // Utiliza o 'totalCotas' (se existir) para blindar o ROI contra depósitos/aportes novos.
  // =================================================================================
  let rentabilidade = 0;
  
  if (userData.totalCotas && userData.totalCotas > 0 && valorTotalAtual > 0) {
    // A cota inicial do sistema é sempre = 1 (R$ 1.000 de depósito viram 1.000 cotas).
    const valorCotaAtual = valorTotalAtual / userData.totalCotas;
    rentabilidade = (valorCotaAtual - 1) * 100;
  } else if (totalAportado > 0) {
    // Fallback retrocompatível para usuários legados sem o campo 'totalCotas'
    const ganhoReal = valorTotalAtual - totalAportado;
    rentabilidade = (ganhoReal / totalAportado) * 100;
  }

  return {
    valorTotalAtual,
    rentabilidade, 
    totalAportado, // Exportado também para caso seja necessário auditar
  };
}