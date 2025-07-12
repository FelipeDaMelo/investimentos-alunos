export type Compra = {
  valor: number;
  data: string;
};

export type Ativo = RendaFixaAtivo | RendaVariavelAtivo;

// Ativo com senha obrigatória (ex: para verificação)
export type AtivoComSenha = Omit<Ativo, 'senha'> & {
  senha: string;
};

interface BaseAtivo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: number;
  patrimonioPorDia: Record<string, number>;
  tipo: 'rendaFixa' | 'rendaVariavel';
  senha?: string;
  subtipo: 'acao' | 'fii' | 'criptomoeda';
}

export interface RendaFixaAtivo extends BaseAtivo {
  tipo: 'rendaFixa';
  categoriaFixa: 'prefixada' | 'posFixada' | 'hibrida';
  parametrosFixa: {
    taxaPrefixada?: number;
    percentualCDI?: number;
    percentualSELIC?: number;
    ipca?: number;
    senha?: string;
    cdiUsado?: number;
    selicUsado?: number;
    ipcaUsado?: number;
    
  };
  taxaReferencia?: number;
}

export interface RendaVariavelAtivo extends BaseAtivo {
  tipo: 'rendaVariavel';
  subtipo: 'acao' | 'fii' | 'criptomoeda';
  tickerFormatado: string;
  quantidade: number;
  precoMedio: number;
  compras: Compra[];
  senha?: string;
  dividendo: number;
}
