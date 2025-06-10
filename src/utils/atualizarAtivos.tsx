// utils/atualizarAtivos.ts
import fetchValorAtual from '../fetchValorAtual';
import { Ativo, RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';
import calcularRendimentoFixa from '../hooks/calcularRendimentoFixa';
import { diasDecorridos } from './datas'; // ajuste o caminho se necessário

export async function atualizarAtivos(
  ativos: Ativo[],
  hoje: string
): Promise<Ativo[]> {
  return await Promise.all(
    ativos.map(async (ativo) => {
      if (ativo.tipo === 'rendaFixa') {
        const diasPassados = Math.max(0, diasDecorridos(ativo.dataInvestimento, hoje));
        const rendimento = await calcularRendimentoFixa(ativo as RendaFixaAtivo);
        return {
          ...ativo,
          valorAtual: rendimento,
          patrimonioPorDia: {
            ...ativo.patrimonioPorDia,
            [hoje]: rendimento,
          },
        };
      } else {
        const ativoVar = ativo as RendaVariavelAtivo;
        const valorAtualString = await fetchValorAtual(ativoVar.tickerFormatado);
        const valorAtual = parseFloat(valorAtualString);
        const patrimonio = valorAtual * ativoVar.quantidade;

        return {
          ...ativo,
          valorAtual,
          patrimonioPorDia: {
            ...ativo.patrimonioPorDia,
            [hoje]: patrimonio,
          },
        };
      }
    })
  );
}
