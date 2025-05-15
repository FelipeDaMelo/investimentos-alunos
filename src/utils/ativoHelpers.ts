// ✅ ativoHelpers.ts
import { RendaFixaAtivo, RendaVariavelAtivo, Compra } from '../types/Ativo';

export const criarAtivoFixa = (
  dados: Omit<RendaFixaAtivo, 'id' | 'valorAtual' | 'patrimonioPorDia' | 'tipo'>
): RendaFixaAtivo => ({
  id: Date.now().toString(),
  valorAtual: dados.valorInvestido,
  patrimonioPorDia: { [new Date().toISOString().split('T')[0]]: dados.valorInvestido },
  ...dados,
  tipo: 'rendaFixa'
});

export const criarAtivoVariavel = (
  novo: Omit<RendaVariavelAtivo, 'id' | 'valorAtual' | 'patrimonioPorDia' | 'tipo' | 'compras'>,
  ativos: RendaVariavelAtivo[]
): RendaVariavelAtivo[] => {
  const hoje = new Date().toISOString().split('T')[0];
  const novaCompra: Compra = {
    valor: novo.valorInvestido,
    data: novo.dataInvestimento
  };

  const indiceExistente = ativos.findIndex(a => a.tickerFormatado === novo.tickerFormatado);

  if (indiceExistente !== -1) {
    const atual = ativos[indiceExistente];
    const novaQuantidade = atual.quantidade + novo.quantidade;
    const novoValorInvestido = atual.valorInvestido + novo.valorInvestido;
    const novoPrecoMedio = novoValorInvestido / novaQuantidade;

    const atualizado: RendaVariavelAtivo = {
      ...atual,
      quantidade: novaQuantidade,
      valorInvestido: novoValorInvestido,
      precoMedio: novoPrecoMedio,
      valorAtual: novaQuantidade * novo.precoMedio,
      dataInvestimento: novo.dataInvestimento,
      compras: [...atual.compras, novaCompra],
      patrimonioPorDia: {
        ...atual.patrimonioPorDia,
        [hoje]: novaQuantidade * novo.precoMedio
      }
    };

    const copia = [...ativos];
    copia[indiceExistente] = atualizado;
    return copia;
  }

  const novoAtivo: RendaVariavelAtivo = {
    ...novo,
    id: Date.now().toString(),
    tipo: 'rendaVariavel',
    precoMedio: novo.precoMedio,
    valorAtual: novo.quantidade * novo.precoMedio,
    patrimonioPorDia: { [hoje]: novo.quantidade * novo.precoMedio },
    compras: [novaCompra]
  };

  return [...ativos, novoAtivo];
};