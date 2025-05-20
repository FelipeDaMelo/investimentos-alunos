// ✅ Atualização de types/Ativo.ts
export type Compra = {
  valor: number;
  data: string;
};

export type Ativo = RendaFixaAtivo | RendaVariavelAtivo;

interface BaseAtivo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: number;
  patrimonioPorDia: Record<string, number>;
  tipo: 'rendaFixa' | 'rendaVariavel';
}

export interface RendaFixaAtivo extends BaseAtivo {
  tipo: 'rendaFixa';
  categoriaFixa: 'prefixada' | 'posFixada' | 'hibrida';
  parametrosFixa: {
    taxaPrefixada?: number;
    percentualCDI?: number;
    percentualSELIC?: number;
    ipca?: number;
  };
}

export interface RendaVariavelAtivo extends BaseAtivo {
  tipo: 'rendaVariavel';
  subtipo: 'acao' | 'fii' | 'criptomoeda';
  tickerFormatado: string;
  quantidade: number;
  precoMedio: number;
  compras: Compra[];
}