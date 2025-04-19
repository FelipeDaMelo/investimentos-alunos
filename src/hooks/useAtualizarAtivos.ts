import { useEffect } from 'react';
import fetchValorAtual from '../fetchValorAtual';
import { RendaFixaAtivo, Ativo } from '../types/Ativo';

type SetAtivos = React.Dispatch<React.SetStateAction<Ativo[]>>;

const useAtualizarAtivos = (ativos: Ativo[], setAtivos: SetAtivos) => {
  useEffect(() => {
    const atualizar = async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const updatedAtivos = await Promise.all(
        ativos.map(async (ativo) => {
          if (ativo.tipo === 'rendaFixa') {
            const ativoRF = ativo as RendaFixaAtivo;
            const diasPassados = Math.floor(
              (new Date(hoje).getTime() - new Date(ativoRF.dataInvestimento).getTime()) / (1000 * 60 * 60 * 24)
            );
            let rendimento = ativoRF.valorInvestido;

            if (ativoRF.categoriaFixa === 'prefixada' && ativoRF.parametrosFixa?.taxaPrefixada) {
              const diaria = ativoRF.parametrosFixa.taxaPrefixada / 100 / 252;
              rendimento *= Math.pow(1 + diaria, diasPassados);
            }

            if (ativoRF.categoriaFixa === 'posFixada') {
              const { percentualSobreCDI, percentualSobreSELIC } = ativoRF.parametrosFixa || {};
              if (percentualSobreCDI !== undefined) {
                const diaria = percentualSobreCDI / 100 / 252;
                rendimento *= Math.pow(1 + diaria, diasPassados);
              } else if (percentualSobreSELIC !== undefined) {
                const diaria = percentualSobreSELIC / 100 / 252;
                rendimento *= Math.pow(1 + diaria, diasPassados);
              }
            }

            if (
              ativoRF.categoriaFixa === 'hibrida' &&
              ativoRF.parametrosFixa?.taxaPrefixada !== undefined &&
              ativoRF.parametrosFixa?.ipca !== undefined
            ) {
              const diariaPrefixada = ativoRF.parametrosFixa.taxaPrefixada / 100 / 252;
              const diariaIPCA = ativoRF.parametrosFixa.ipca / 100 / 252;
              rendimento *= Math.pow(1 + diariaPrefixada + diariaIPCA, diasPassados);
            }

            return {
              ...ativoRF,
              valorAtual: rendimento,
              patrimonioPorDia: {
                ...ativoRF.patrimonioPorDia,
                [hoje]: rendimento,
              },
            };
          } else {
            const valorAtual = parseFloat(await fetchValorAtual(ativo.nome));
            const updatedPatrimonio = ativo.tipo === 'cripto'
              ? valorAtual * ('fracaoAdquirida' in ativo ? ativo.fracaoAdquirida : 0)
              : valorAtual * (ativo.valorInvestido / valorAtual);

            return {
              ...ativo,
              valorAtual,
              patrimonioPorDia: {
                ...ativo.patrimonioPorDia,
                [hoje]: updatedPatrimonio,
              },
            };
          }
        })
      );
      setAtivos(updatedAtivos);
    };

    atualizar();
    const intervalId = setInterval(atualizar, 86400000);
    return () => clearInterval(intervalId);
  }, []);
};

export default useAtualizarAtivos;
