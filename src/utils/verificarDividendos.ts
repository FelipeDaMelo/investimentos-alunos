// ARQUIVO: src/utils/verificarDividendos.ts (VERSÃO FINAL COM COMPARAÇÃO DE DATA ROBUSTA)

import { RendaVariavelAtivo } from '../types/Ativo';
import { RegistroHistorico } from '../hooks/RegistroHistorico';
import { PendenciaDividendo } from '../components/InformarDividendosPendentesModal';

export function verificarDividendosPendentes(
  ativoFII: RendaVariavelAtivo,
  historicoCompleto: RegistroHistorico[]
): PendenciaDividendo[] {
  
  // Opcional: remover o console.clear() se preferir manter os logs antigos
  // console.clear();
  console.log(`%c--- INICIANDO VERIFICAÇÃO PARA: ${ativoFII.nome} ---`, "color: blue; font-weight: bold; font-size: 14px;");

  const historicoDoAtivo = historicoCompleto
    .filter(h => h.nome === ativoFII.nome)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const primeiraCompra = historicoDoAtivo.find(h => h.tipo === 'compra');

  if (!primeiraCompra) {
    console.log("LOG: Nenhuma compra encontrada.");
    return [];
  }
  console.log("LOG: Primeira compra em:", primeiraCompra.data);

  const dividendosJaPagos = new Set<string>();
  historicoDoAtivo.forEach(h => {
    if (h.tipo === 'dividendo' && h.mesApuracao) {
      dividendosJaPagos.add(h.mesApuracao);
    }
  });
  console.log("LOG: Meses pagos:", Array.from(dividendosJaPagos));

  const pendencias: PendenciaDividendo[] = [];
  const hoje = new Date();
  
  let dataCorrente = new Date(primeiraCompra.data);
  dataCorrente.setDate(1);
  dataCorrente.setHours(0, 0, 0, 0);

  const inicioDoMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  console.log(`LOG: Loop de meses de ${dataCorrente.toISOString().slice(0,7)} até ANTES de ${inicioDoMesAtual.toISOString().slice(0,7)}`);
  
  while (dataCorrente < inicioDoMesAtual) {
    const ano = dataCorrente.getFullYear();
    const mes = dataCorrente.getMonth();
    const mesApuracao = `${ano}-${String(mes + 1).padStart(2, '0')}`;
    
    console.log(`\n%cAnalisando Mês Passado: ${mesApuracao}`, "color: green;");

    if (dividendosJaPagos.has(mesApuracao)) {
      console.log(` -> IGNORADO (pago).`);
      dataCorrente.setMonth(dataCorrente.getMonth() + 1);
      continue;
    }

    let quantidadeNaqueleMes = 0;
    const finalDaqueleMes = new Date(ano, mes + 1, 0); 
    finalDaqueleMes.setHours(23, 59, 59, 999);
    
    // Converte a data final para um número para uma comparação infalível
    const finalDaqueleMesTimestamp = finalDaqueleMes.getTime();
    console.log(` -> Calculando posse até ${finalDaqueleMes.toISOString()}`);

    for (const transacao of historicoDoAtivo) {
      // --- A CORREÇÃO ESTÁ AQUI ---
      // Compara os timestamps (números) em vez dos objetos Date
      if (new Date(transacao.data).getTime() <= finalDaqueleMesTimestamp) {
        if (transacao.tipo === 'compra') {
            quantidadeNaqueleMes += transacao.quantidade || 0;
        } else if (transacao.tipo === 'venda') {
            quantidadeNaqueleMes -= transacao.quantidade || 0;
        }
      }
    }
    
    console.log(` -> Quantidade no final de ${mesApuracao}: ${quantidadeNaqueleMes}`);

    if (quantidadeNaqueleMes > 0.00000001) {
      console.log(`%c   ✅ PENDÊNCIA ENCONTRADA para ${mesApuracao}`, "color: orange; font-weight: bold;");
      pendencias.push({
        mesApuracao,
        quantidadeNaqueleMes: quantidadeNaqueleMes,
      });
    } else {
      console.log(` -> IGNORADO (quantidade zero).`);
    }

    dataCorrente.setMonth(dataCorrente.getMonth() + 1);
  }

  console.log(`\n%cAnalisando Mês Atual: ${hoje.toISOString().slice(0,7)}`, "color: purple;");
  const mesApuracaoAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  
  if (hoje.getDate() >= 15 && !dividendosJaPagos.has(mesApuracaoAtual)) {
      let quantidadeNoMesAtual = 0;
      const hojeTimestamp = hoje.getTime();

      for (const transacao of historicoDoAtivo) {
          if (new Date(transacao.data).getTime() <= hojeTimestamp) {
               if (transacao.tipo === 'compra') {
                  quantidadeNoMesAtual += transacao.quantidade || 0;
              } else if (transacao.tipo === 'venda') {
                  quantidadeNoMesAtual -= transacao.quantidade || 0;
              }
          }
      }
      console.log(` -> Quantidade até hoje: ${quantidadeNoMesAtual}`);
      
      if (quantidadeNoMesAtual > 0.00000001) {
           console.log(`%c   ✅ PENDÊNCIA ENCONTRADA para ${mesApuracaoAtual}`, "color: orange; font-weight: bold;");
           pendencias.push({
            mesApuracao: mesApuracaoAtual,
            quantidadeNaqueleMes: quantidadeNoMesAtual
          });
      }
  } else {
      console.log(" -> IGNORADO (não atendeu às condições do mês atual).");
  }

  console.log(`\n%c--- VERIFICAÇÃO FINALIZADA ---`, "color: blue; font-weight: bold; font-size: 14px;");
  console.log("Resultado final (pendências retornadas):", pendencias);
  return pendencias;
}