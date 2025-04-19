export type Ativo = RendaFixaAtivo | RendaVariavelAtivo;

interface BaseAtivo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: number;
  patrimonioPorDia: { [key: string]: number };
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
  subtipo: 'acao' | 'fii' | 'cripto';
  tickerFormatado: string;
  quantidade: number;
}