// Caminho do arquivo: src/types/Ranking.ts

/**
 * Representa a estrutura de um documento da coleção "rankings" no Firestore.
 * É como a "planta" de como um ranking é salvo no banco de dados.
 */
export interface Ranking {
  id: string;          // O ID do documento gerado pelo Firestore
  nome: string;        // O nome do ranking, ex: "Competição de Outubro"
  participantes: string[]; // Um array com os IDs (nomeGrupo) dos usuários
  // Opcional, mas útil:
  criadorId?: string;
  dataCriacao?: Date;
}

/**
 * Representa os dados já processados de um único participante,
 * prontos para serem exibidos na tela de detalhes do ranking.
 */
export interface RankingParticipantData {
  nomeGrupo: string;        // O ID do participante
  fotoGrupo?: string;       // A URL da foto (opcional)
  rentabilidadeAtual: number; // A rentabilidade percentual final para ordenar a lista
  
  // Usado para construir o gráfico de evolução.
  // A chave é a data ('YYYY-MM-DD') e o valor é a rentabilidade percentual naquele dia.
  rentabilidadePorDia: Record<string, number>; 
}