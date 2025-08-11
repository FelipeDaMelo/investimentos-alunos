export interface RegistroHistorico {
  tipo: 'compra' | 'venda' | 'deposito' | 'dividendo' | 'transferencia' | 'ir';
  valor: number;
  nome?: string;
  destino?: 'fixa' | 'variavel';
  categoria?: 'rendaFixa' | 'rendaVariavel';
  subtipo?: 'acao' | 'fii' | 'criptomoeda';
  data: string;
  valorBruto?: number;
  valorLiquido?: number;
  imposto?: number;
  diasAplicado?: number;
  quantidade?: number;
  mesApuracao?: string;
  comentario?: string;
}
