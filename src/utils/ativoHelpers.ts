//src/utils/ativoHelpers.ts
import { RendaFixaAtivo, RendaVariavelAtivo } from '../types/Ativo';

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
  dados: Omit<RendaVariavelAtivo, 'id' | 'valorAtual' | 'patrimonioPorDia' | 'tipo'>
): RendaVariavelAtivo => {
  const valorAtual = dados.quantidade > 0 
    ? dados.valorInvestido / dados.quantidade 
    : dados.valorInvestido;

  return {
    id: Date.now().toString(),
    valorAtual,
    patrimonioPorDia: { [new Date().toISOString().split('T')[0]]: dados.valorInvestido },
    ...dados,
    tipo: 'rendaVariavel'
  };
};