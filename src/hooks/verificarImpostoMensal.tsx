import { RegistroHistorico } from './RegistroHistorico';
import { ResumoIR } from '../components/ResumoIR';
import { calcularImpostoRenda } from './useCalcularIR';

interface CompraFIFO {
  nome: string;
  subtipo: 'acao' | 'fii' | 'criptomoeda';
  data: string;
  quantidade: number;
  valorTotal: number;
}

export async function verificarImpostoMensal(historico: RegistroHistorico[]): Promise<ResumoIR[]> {

  // CORREÇÃO: A memória de pagamentos agora usa o campo correto 'mesApuracao'.
  const impostosJaPagos = new Set<string>();
  historico.forEach(registro => {
    // A chave é criada com o MÊS DA APURAÇÃO, não do pagamento.
    if (registro.tipo === 'ir' && registro.subtipo && registro.mesApuracao) {
      const chavePaga = `${registro.mesApuracao}-${registro.subtipo}`;
      impostosJaPagos.add(chavePaga);
    }
  });

  // ETAPA 1: Processar o histórico e agrupar vendas (sem alterações aqui)
  const comprasFIFO = new Map<string, CompraFIFO[]>();
  const vendasPorMes = new Map<string, { valorVenda: number; valorCompra: number; subtipo: string }>();

  historico.forEach(registro => {
    if (!registro.nome || !registro.subtipo || !registro.quantidade) return;
    if (registro.tipo !== 'compra' && registro.tipo !== 'venda') return;

    const chaveAtivo = `${registro.subtipo}-${registro.nome}`;
    const mes = registro.data.slice(0, 7); // YYYY-MM

    if (registro.tipo === 'compra') {
      const lista = comprasFIFO.get(chaveAtivo) || [];
      lista.push({
        nome: registro.nome,
        subtipo: registro.subtipo as 'acao' | 'fii' | 'criptomoeda',
        data: registro.data,
        quantidade: registro.quantidade,
        valorTotal: registro.valor,
      });
      comprasFIFO.set(chaveAtivo, lista);
    }

    if (registro.tipo === 'venda') {
      const lista = comprasFIFO.get(chaveAtivo) || [];
      let qtdRestante = registro.quantidade;
      let custoTotal = 0;
      while (qtdRestante > 0 && lista.length > 0) {
        const compra = lista[0];
        const qtdConsumir = Math.min(qtdRestante, compra.quantidade);
        const precoUnit = compra.valorTotal / compra.quantidade;
        custoTotal += qtdConsumir * precoUnit;
        compra.quantidade -= qtdConsumir;
        qtdRestante -= qtdConsumir;
        if (compra.quantidade === 0) lista.shift();
      }
      const chaveMes = `${mes}-${registro.subtipo}`;
      const atual = vendasPorMes.get(chaveMes) || {
        valorVenda: 0, valorCompra: 0, subtipo: registro.subtipo,
      };
      const valorVenda = registro.valorBruto ?? registro.valor;
      vendasPorMes.set(chaveMes, {
        subtipo: registro.subtipo,
        valorVenda: atual.valorVenda + valorVenda,
        valorCompra: atual.valorCompra + custoTotal,
      });
    }
  });

  // ETAPA 2: Cálculo cronológico (sem alterações aqui)
  const resumos: ResumoIR[] = [];
  const prejuizosAcumulados = { acao: 0, fii: 0, criptomoeda: 0 };
  const mesesOrdenados = Array.from(vendasPorMes.keys()).sort();

  for (const chave of mesesOrdenados) {
    const dadosMes = vendasPorMes.get(chave)!;
    const partes = chave.split('-');
    const mes = `${partes[0]}-${partes[1]}`;
    const subtipo = partes[2] as 'acao' | 'fii' | 'criptomoeda';

    const resultadoMesBruto = dadosMes.valorVenda - dadosMes.valorCompra;
    const prejuizoAnterior = prejuizosAcumulados[subtipo];
    let baseCalculo = 0;
    let prejuizoCompensado = 0;

    if (resultadoMesBruto > 0) {
      const valorACompensar = Math.min(resultadoMesBruto, prejuizoAnterior);
      baseCalculo = resultadoMesBruto - valorACompensar;
      prejuizoCompensado = valorACompensar;
      prejuizosAcumulados[subtipo] -= valorACompensar;
    } else {
      baseCalculo = 0;
      prejuizoCompensado = 0;
      prejuizosAcumulados[subtipo] += Math.abs(resultadoMesBruto);
    }

    const imposto = calcularImpostoRenda({
      subtipo: subtipo,
      totalVendidoNoMes: dadosMes.valorVenda, // Para isenção de ações
      baseCalculo: baseCalculo, // A base de cálculo já com o prejuízo abatido
    });

    // A condição final agora vai funcionar, pois 'impostosJaPagos' está correto.
    if (imposto > 0 && !impostosJaPagos.has(chave)) {
      resumos.push({
        mes: mes,
        subtipo: subtipo,
        resultadoMesBruto: resultadoMesBruto,
        prejuizoCompensado: prejuizoCompensado,
        baseCalculo: baseCalculo,
        imposto: imposto,
        totalVendidoNoMes: dadosMes.valorVenda,
        valorCompra: dadosMes.valorCompra,
      });
    }
  }

  return resumos;
}