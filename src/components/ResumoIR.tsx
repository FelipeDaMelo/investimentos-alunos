export interface ResumoIR {
  mes: string;
  subtipo: string;
  // Novos campos para detalhar o cálculo:
  resultadoMesBruto: number;  // Lucro ou prejuízo do mês ANTES da compensação
  prejuizoCompensado: number; // Quanto do "balde" de prejuízo foi usado para abater o lucro
  baseCalculo: number;        // O valor final sobre o qual o imposto foi calculado (resultadoMesBruto - prejuizoCompensado)
  imposto: number;            // O valor do imposto devido
  totalVendidoNoMes: number;  // Mantemos este campo para a regra de isenção de Ações
 valorCompra: number; // <-- ADICIONE ESTA LINHA
}