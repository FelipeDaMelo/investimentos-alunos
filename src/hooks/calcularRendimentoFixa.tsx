import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo } from '../types/Ativo';
import { diasDecorridos } from '../utils/datas'; // <- certifique-se de importar corretamente

const calcularRendimentoFixa = async (ativo: RendaFixaAtivo): Promise<number> => {
  const t = diasDecorridos(ativo.dataInvestimento); // cálculo correto dos dias
  const principal = ativo.valorInvestido;

  if (t <= 0) return principal;

  if (ativo.categoriaFixa === 'prefixada' && ativo.parametrosFixa?.taxaPrefixada) {
    const diaria = ativo.parametrosFixa.taxaPrefixada / 100 / 252;
    return principal * Math.pow(1 + diaria, t);
  }

  if (ativo.categoriaFixa === 'posFixada') {
    const {
      percentualCDI = 0,
      percentualSELIC = 0,
    } = ativo.parametrosFixa || {};

    if (percentualCDI > 0) {
      const cdi = parseFloat(await fetchValorAtual('CDI')); // taxa a.d.
      const diaria = (cdi * percentualCDI) / 10000;
      return principal * Math.pow(1 + diaria, t);
    } else if (percentualSELIC > 0) {
      const selic = parseFloat(await fetchValorAtual('SELIC')); // taxa a.d.
      const diaria = (selic * percentualSELIC) / 10000;
      return principal * Math.pow(1 + diaria, t);
    }
  }

  if (ativo.categoriaFixa === 'hibrida') {
    const {
      taxaPrefixada = 0,
      percentualCDI = 0,
      percentualSELIC = 0,
      ipca = 0
    } = ativo.parametrosFixa || {};

    const diariaPrefixada = taxaPrefixada / 100 / 252;
    let diariaIndexada = 0;

    if (percentualCDI > 0) {
      const cdi = parseFloat(await fetchValorAtual('CDI'));
      diariaIndexada = (cdi * percentualCDI) / 10000;
    } else if ((percentualSELIC ?? 0) > 0) {
      const selic = parseFloat(await fetchValorAtual('SELIC'));
      diariaIndexada = (selic * percentualSELIC) / 10000;
    } else if (ipca > 0) {
      const ipcaMensal = parseFloat(await fetchValorAtual('IPCA'));
      diariaIndexada = (Math.pow(1 + ipcaMensal / 100, 1 / 30) - 1) * (ipca / 100);
    }

    return principal * Math.pow(1 + diariaPrefixada + diariaIndexada, t);
  }

  return principal; // fallback
};

export default calcularRendimentoFixa;
