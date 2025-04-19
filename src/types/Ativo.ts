// src/types/Ativo.ts
export type Ativo = RendaFixaAtivo | RendaVariavelAtivo | CriptoAtivo;

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
    percentualSobreCDI?: number;
    percentualSobreSELIC?: number;
    ipca?: number;
  };
}

export interface RendaVariavelAtivo extends BaseAtivo {
  tipo: 'rendaVariavel';
}

export interface CriptoAtivo extends BaseAtivo {
  tipo: 'cripto';
  fracaoAdquirida: number;
}
