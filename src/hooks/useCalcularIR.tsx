// ARQUIVO: useCalcularIR.ts ou onde sua função estiver

// A interface agora espera a "base de cálculo" em vez dos valores de compra/venda
interface DadosIRVariavel {
  subtipo: 'acao' | 'fii' | 'criptomoeda';
  totalVendidoNoMes: number; // Soma de todas as vendas do mês (mesmo subtipo)
  baseCalculo: number;         // O lucro do mês JÁ AJUSTADO pela compensação de prejuízos
}

export function calcularImpostoRenda({
  subtipo,
  totalVendidoNoMes,
  baseCalculo
}: DadosIRVariavel): number {
  
  // A verificação agora é feita na base de cálculo.
  // Se for negativa ou zero após a compensação, não há imposto.
  if (baseCalculo <= 0) {
    return 0; 
  }

  // A lógica de alíquota e isenção permanece EXATAMENTE A MESMA.
  // A única diferença é que agora aplicamos a alíquota sobre a `baseCalculo`.
  switch (subtipo) {
    case 'acao':
      // A isenção de 20k depende do TOTAL VENDIDO, não do lucro. Esta lógica está correta.
      return totalVendidoNoMes <= 20000 ? 0 : baseCalculo * 0.15;
    
    case 'fii':
      // 20% sobre o lucro líquido (base de cálculo)
      return baseCalculo * 0.20;
      
    case 'criptomoeda':
      // A isenção de 35k depende do TOTAL VENDIDO. Esta lógica está correta.
      return totalVendidoNoMes <= 35000 ? 0 : baseCalculo * 0.15;
      
    default:
      console.warn('Subtipo desconhecido para IR:', subtipo);
      return 0;
  }
}