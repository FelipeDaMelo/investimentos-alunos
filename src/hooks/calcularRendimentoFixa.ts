import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo } from '../types/Ativo';

const calcularRendimentoFixa = async (ativo: RendaFixaAtivo, diasPassados: number): Promise<number> => {
  let rendimento = ativo.valorInvestido;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
    rendimento *= Math.pow(1 + diaria, diasPassados);
  }

  if (ativo.categoriaFixa === 'posFixada') {
    const { percentualCDI, percentualSELIC, ipca } = ativo.parametrosFixa || {};

    if (percentualCDI && percentualCDI > 0) {
      const cdiAtual = parseFloat(await fetchValorAtual('CDI')); // % a.d.
      const diaria = (cdiAtual * percentualCDI / 100) / 100;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    } 
    else if (percentualSELIC && percentualSELIC > 0) {
      const selicAtual = parseFloat(await fetchValorAtual('SELIC')); // % a.d.
      const diaria = (selicAtual * percentualSELIC / 100) / 100;
      rendimento *= Math.pow(1 + diaria, diasPassados);
    }
      }

  if (ativo.categoriaFixa === 'hibrida') {
    const diariaPrefixada = (ativo.parametrosFixa?.taxaPrefixada || 0) / 100 / 252;

    let diariaIndexada = 0;

    if (ativo.parametrosFixa?.percentualCDI && ativo.parametrosFixa.percentualCDI > 0) {
      const cdiAtual = parseFloat(await fetchValorAtual('CDI'));
      diariaIndexada = (cdiAtual * ativo.parametrosFixa.percentualCDI / 100) / 100;
    } else if (ativo.parametrosFixa?.percentualSELIC && ativo.parametrosFixa.percentualSELIC > 0) {
      const selicAtual = parseFloat(await fetchValorAtual('SELIC'));
      diariaIndexada = (selicAtual * ativo.parametrosFixa.percentualSELIC / 100) / 100;
    } else if (ativo.parametrosFixa?.ipca && ativo.parametrosFixa.ipca > 0) {
      const ipcaMensal = parseFloat(await fetchValorAtual('IPCA'));
      diariaIndexada = (Math.pow(1 + ipcaMensal / 100, 1 / 30) - 1) * (ativo.parametrosFixa.ipca / 100);
    }

    rendimento *= Math.pow(1 + diariaPrefixada + diariaIndexada, diasPassados);
  }

  return rendimento;
};

export default calcularRendimentoFixa;
