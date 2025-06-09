export function calcularImpostoRenda(
  dataInvestimento: string,
  valorInvestido: number,
  valorAtual: number
) {
  const dataCompra = new Date(dataInvestimento);
  const dataHoje = new Date();

  const diffDias = Math.floor(
    (dataHoje.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24)
  );
  const lucro = valorAtual - valorInvestido;

  let aliquota = 0;
  if (diffDias <= 180) aliquota = 0.225;
  else if (diffDias <= 360) aliquota = 0.20;
  else if (diffDias <= 720) aliquota = 0.175;
  else aliquota = 0.15;

  const imposto = lucro > 0 ? lucro * aliquota : 0;
  const valorLiquido = valorAtual - imposto;
  const LucroLiquido = valorAtual - imposto - valorInvestido;
  console.log('📊 cálculo IR →', { diffDias, valorAtual, imposto, valorLiquido, LucroLiquido });
  return {
    diasAplicado: diffDias,
    lucro,
    aliquota,
    imposto,
    valorLiquido,
    LucroLiquido,
  };
}
