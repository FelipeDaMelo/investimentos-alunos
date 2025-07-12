// ARQUIVO: src/utils/verificarDividendos.ts (com logs de depuração)

import { RendaVariavelAtivo } from '../types/Ativo';
import { RegistroHistorico } from '../hooks/RegistroHistorico';
import { PendenciaDividendo } from '../components/InformarDividendosPendentesModal';
import { mesEncerrado } from './mesEncerrado';

export function verificarDividendosPendentes(
  ativoFII: RendaVariavelAtivo,
  historicoCompleto: RegistroHistorico[]
): PendenciaDividendo[] {
  console.log(`--- INICIANDO VERIFICAÇÃO PARA: ${ativoFII.nome} ---`);

  const primeiraCompra = historicoCompleto
    .filter(h => h.tipo === 'compra' && h.nome === ativoFII.nome)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

  if (!primeiraCompra) {
    console.log("Nenhuma compra encontrada para este ativo. Encerrando.");
    return [];
  }
  console.log("Primeira compra em:", primeiraCompra.data);

  const dividendosJaPagos = new Set<string>();
  historicoCompleto.forEach(h => {
    if (h.tipo === 'dividendo' && h.nome === ativoFII.nome && h.mesApuracao) {
      dividendosJaPagos.add(h.mesApuracao);
    }
  });
  console.log("Dividendos já pagos para este ativo:", dividendosJaPagos);

  const pendencias: PendenciaDividendo[] = [];
  let dataCorrente = new Date(new Date(primeiraCompra.data).getFullYear(), new Date(primeiraCompra.data).getMonth(), 1);

  console.log("Iniciando loop de meses a partir de:", dataCorrente.toISOString());
  while (dataCorrente <= new Date()) {
    const ano = dataCorrente.getFullYear();
    const mes = dataCorrente.getMonth();
    const mesApuracao = `${ano}-${String(mes + 1).padStart(2, '0')}`;

    console.log(`\nAnalisando mês: ${mesApuracao}`);

    const isEncerrado = mesEncerrado(mesApuracao);
    const isPago = dividendosJaPagos.has(mesApuracao);
    console.log(`- Mês encerrado? ${isEncerrado}`);
    console.log(`- Já foi pago? ${isPago}`);

    if (isEncerrado && !isPago) {
      console.log("-> CONDIÇÃO VÁLIDA. Calculando quantidade de cotas...");
      
      let quantidadeNaqueleMes = 0;
      const finalDaqueleMes = new Date(ano, mes + 1, 0);

      historicoCompleto
        .filter(h => h.nome === ativoFII.nome && (h.tipo === 'compra' || h.tipo === 'venda'))
        .filter(h => new Date(h.data) <= finalDaqueleMes)
        .forEach(transacao => {
          if (transacao.tipo === 'compra' && transacao.quantidade) {
            quantidadeNaqueleMes += transacao.quantidade;
          } else if (transacao.tipo === 'venda' && transacao.quantidade) {
            quantidadeNaqueleMes -= transacao.quantidade;
          }
        });
      
      console.log(`- Quantidade de cotas no final de ${mesApuracao}: ${quantidadeNaqueleMes}`);

      if (quantidadeNaqueleMes > 0) {
        console.log(`✅ ADICIONANDO PENDÊNCIA PARA ${mesApuracao}`);
        pendencias.push({
          mesApuracao,
          quantidadeNaqueleMes: parseFloat(quantidadeNaqueleMes.toPrecision(15)),
        });
      } else {
        console.log(`- Ignorando ${mesApuracao} (quantidade era zero ou negativa).`);
      }
    } else {
        console.log("-> CONDIÇÃO INVÁLIDA. Pulando para o próximo mês.");
    }

    dataCorrente.setMonth(dataCorrente.getMonth() + 1);
  }

  console.log("--- VERIFICAÇÃO FINALIZADA ---");
  console.log("Pendências encontradas:", pendencias);
  return pendencias;
}