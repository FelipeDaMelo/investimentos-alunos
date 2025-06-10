interface DadosVenda {
  subtipo: 'acao' | 'fii' | 'criptomoeda';
  data: string; // formato ISO (ex: "2025-06-08")
  valorVenda: number; // total da venda
  valorCompra: number; // custo de aquisição
  totalVendidoNoMes: number; // soma de todas as vendas do mês (mesmo subtipo)
}

export function calcularImpostoRenda({
  subtipo,
  data,
  valorVenda,
  valorCompra,
  totalVendidoNoMes
}: DadosVenda): number {
  const lucro = valorVenda - valorCompra;
  if (lucro <= 0) return 0; // sem lucro, sem imposto

  switch (subtipo) {
    case 'acao':
      // isento se total vendido no mês for até 20 mil
      return totalVendidoNoMes <= 20000 ? 0 : lucro * 0.15;
    case 'fii':
      return lucro * 0.20;
    case 'criptomoeda':
      return totalVendidoNoMes <= 35000 ? 0 : lucro * 0.15;
    default:
      console.warn('Subtipo desconhecido para IR:', subtipo);
      return 0;
  }
}
