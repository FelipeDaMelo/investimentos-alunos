export type Ativo = RendaFixaAtivo | RendaVariavelAtivo;

interface BaseAtivo {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: number;
  patrimonioPorDia: Record<string, number>;
  tipo: 'rendaFixa' | 'rendaVariavel';
  dataAdicao: string;
}

export interface RendaFixaAtivo extends BaseAtivo {
  tipo: 'rendaFixa';
  categoriaFixa: 'prefixada' | 'posFixada' | 'hibrida';
  parametrosFixa: {
    taxaPrefixada?: number;
    percentualCDI?: number;
    percentualSELIC?: number;
    ipca?: number;
    vencimento?: string;
  };
}

export interface RendaVariavelAtivo extends BaseAtivo {
  tipo: 'rendaVariavel';
  subtipo: 'acao' | 'fii' | 'criptomoeda' | 'acao_internacional';
  tickerFormatado: string;
  quantidade: number;
  precoMedio: number;
}

export interface GrupoInvestimento {
  nome: string;
  valorTotalInvestido: number;
  porcentagemRendaFixa: number;
  porcentagemRendaVariavel: number;
  dataCriacao: string;
  ativos: Ativo[];
  historicoPatrimonio: {
    data: string;
    valorTotal: number;
    detalhesAtivos: Record<string, number>;
  }[];
  historicoVendas: {
    data: string;
    valorVendido: number;
    lucroPrejuizo: number;
    porcentagem: number;
  }[];
  configuracoes: {
    moedaPadrao: 'BRL' | 'USD';
    notificacoesAtivadas: boolean;
  };
}