import fetchValorAtual from '../fetchValorAtual'; 
import { RendaFixaAtivo } from '../types/Ativo';

const calcularRendimentoFixa = async (ativo: RendaFixaAtivo, diasPassados: number): Promise<number> => {
  let rendimento = ativo.valorInvestido;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
    rendimento *= Math.pow(1 + diaria, diasPassados);
  }

  if (ativo.categoriaFixa === 'posFixada') {
    const { percentualCDI, percentualSELIC } = ativo.parametrosFixa || {};

    if (percentualCDI !== undefined) {
      const cdiAtual = parseFloat(await fetchValorAtual('CDI')); // busca CDI real
      const diaria = (cdiAtual * percentualCDI / 100) / 100 / 252;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    } 
    else if (percentualSELIC !== undefined) {
      const selicAtual = parseFloat(await fetchValorAtual('SELIC')); // busca SELIC real
      const diaria = (selicAtual * percentualSELIC / 100) / 100 / 252;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    }
  }

  if (ativo.categoriaFixa === 'hibrida') {
    const diariaPrefixada = (ativo.parametrosFixa?.taxaPrefixada || 0) / 100 / 252;
    const diariaIPCA = (ativo.parametrosFixa?.ipca || 0) / 100 / 252;
    rendimento *= Math.pow(1 + diariaPrefixada + diariaIPCA, diasPassados);
  }

  return rendimento;
};

export default calcularRendimentoFixa;
