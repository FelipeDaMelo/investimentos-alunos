import { RegistroHistorico } from '../types/RegistroHistorico'; // ajuste o caminho conforme necessário

export function calcularTotalVendidoNoMes(
  historico: RegistroHistorico[],
  subtipo: 'acao' | 'fii' | 'criptomoeda',
  data: string
): number {
  const [ano, mes] = data.split('T')[0].split('-'); // ex: "2025-06-08" → ["2025", "06", "08"]

  return historico
    .filter((registro) =>
      registro.tipo === 'venda' &&
      registro.subtipo === subtipo &&
      registro.data.startsWith(`${ano}-${mes}`)
    )
    .reduce((total, venda) => total + (venda.valor || 0), 0);
}
