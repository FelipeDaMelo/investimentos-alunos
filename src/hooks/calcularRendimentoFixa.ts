import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo } from '../types/Ativo';

const calcularRendimentoFixa = async (ativo: RendaFixaAtivo, t: number): Promise<number> => {
  let rendimento = ativo.valorAtual;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 365;
    rendimento *= Math.pow(1 + diaria, t);
  }

  if (ativo.categoriaFixa === 'posFixada') {
   const {
  percentualCDI = 0,
  percentualSELIC = 0,
  ipca = 0
} = ativo.parametrosFixa || {};

    if (percentualCDI && percentualCDI > 0) {
      const cdiAtual = parseFloat(await fetchValorAtual('CDI')); // % a.d.
      const diaria = (cdiAtual * percentualCDI / 100) / 100;
      rendimento *= Math.pow(1 + diaria, t);
    } 
    else if (percentualSELIC && percentualSELIC > 0) {
      const selicAtual = parseFloat(await fetchValorAtual('SELIC')); // % a.d.
      const diaria = (selicAtual * percentualSELIC / 100) / 100;
      rendimento *= Math.pow(1 + diaria, t);
    }
      }

if (ativo.categoriaFixa === 'hibrida') {
  const diariaPrefixada = (ativo.parametrosFixa?.taxaPrefixada || 0) / 100 / 365;

  let diariaIndexada = 0;
  const {
  percentualCDI = 0,
  percentualSELIC = 0,
  ipca = 0
} = ativo.parametrosFixa || {};


  if (percentualCDI > 0) {
    const cdiAtual = parseFloat(await fetchValorAtual('CDI'));
    diariaIndexada = (cdiAtual * percentualCDI / 100) / 100;
  } else if (percentualSELIC?? 0 > 0) {
    const selicAtual = parseFloat(await fetchValorAtual('SELIC'));
    diariaIndexada = (selicAtual * percentualSELIC / 100) / 100;
  } else if (ipca > 0) {
    const ipcaMensal = parseFloat(await fetchValorAtual('IPCA'));
    diariaIndexada = (Math.pow(1 + ipcaMensal / 100, 1 / 30) - 1) * (ipca / 100);
  }

  rendimento *= Math.pow(1 + diariaPrefixada + diariaIndexada, t);
}

  return rendimento;
};

export default calcularRendimentoFixa;
