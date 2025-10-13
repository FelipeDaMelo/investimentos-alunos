// Caminho: src/utils/calculateUserMetrics.ts

import { Ativo } from "../types/Ativo";
import { RegistroHistorico } from "../hooks/RegistroHistorico";
import { calcularSaldoFixa, calcularSaldoVariavel } from "./ativoHelpers";

/**
 * Calcula as métricas de performance de um usuário a partir dos seus dados brutos.
 * @param userData O objeto de dados do documento do usuário no Firestore.
 * @returns Um objeto com o valor total da carteira e a rentabilidade.
 */
export function calculateUserMetrics(userData: any) {
  const historico = (userData.historico || []) as RegistroHistorico[];
  const ativos = (userData.ativos || []) as Ativo[];

  // 1. Calcula o Total Aportado
  const totalAportado = historico
    .filter(registro => registro.tipo === 'deposito')
    .reduce((soma, deposito) => soma + deposito.valor, 0);

  // 2. Calcula o Valor Total da Carteira
  const valorAtivos = ativos.reduce((total, ativo) => total + ativo.valorAtual, 0);
  const saldoFixa = calcularSaldoFixa(historico);
  const saldoVariavel = calcularSaldoVariavel(historico);
  const valorTotalAtual = valorAtivos + saldoFixa + saldoVariavel;

  // 3. Calcula a Rentabilidade
  let rentabilidade = 0;
  if (userData.valorCotaPorDia) {
    // Método de Cotas (preferencial e mais preciso)
    const datasDeCota = Object.keys(userData.valorCotaPorDia).sort();
    if (datasDeCota.length > 0) {
      const ultimaData = datasDeCota[datasDeCota.length - 1];
      const ultimaCota = userData.valorCotaPorDia[ultimaData];
      rentabilidade = (ultimaCota - 1) * 100;
    }
  } else if (totalAportado > 0) {
    // Método Simples (fallback para usuários não migrados)
    rentabilidade = ((valorTotalAtual - totalAportado) / totalAportado) * 100;
  }

  return {
    valorTotalAtual,
    rentabilidade,
  };
}