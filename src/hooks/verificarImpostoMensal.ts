import { calcularImpostoRenda } from './useCalcularIR';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Dispatch, SetStateAction } from 'react';
import { RegistroHistorico } from './RegistroHistorico';
import { ResumoIR } from '../components/ResumoIR';
export async function verificarImpostoMensal(
  historico: RegistroHistorico[],
  setValorVariavelDisponivel: Dispatch<SetStateAction<number>>,
  setHistorico: Dispatch<SetStateAction<RegistroHistorico[]>>,
  login: string,
  somenteResumo: boolean
): Promise<ResumoIR[]> {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);

  const vendasAgrupadas = new Map<string, {
    valorTotalVenda: number;
    valorTotalCompra: number;
    subtipo: string;
  }>();

  historico.forEach(registro => {
    if (
      registro.tipo === 'venda' &&
      registro.subtipo &&
      registro.data.slice(0, 7) !== mesAtual
    ) {
      const chave = `${registro.subtipo}-${registro.data.slice(0, 7)}`;
      const atual = vendasAgrupadas.get(chave) || {
        valorTotalVenda: 0,
        valorTotalCompra: 0,
        subtipo: registro.subtipo
      };

      const valorBruto = registro.valorBruto ?? registro.valor;
      const imposto = registro.imposto ?? 0;

      vendasAgrupadas.set(chave, {
        subtipo: registro.subtipo,
        valorTotalVenda: atual.valorTotalVenda + valorBruto,
        valorTotalCompra: atual.valorTotalCompra + (valorBruto - imposto)
      });
    }
  });

  const resumos: ResumoIR[] = [];

  for (const [chave, dados] of vendasAgrupadas.entries()) {
    const [subtipo, ano, mes] = chave.split('-');
    const mesAno = `${ano}-${mes}`;

    const imposto = calcularImpostoRenda({
      subtipo: subtipo as 'acao' | 'fii' | 'criptomoeda',
      data: `${mesAno}-01`,
      valorVenda: dados.valorTotalVenda,
      valorCompra: dados.valorTotalCompra,
      totalVendidoNoMes: dados.valorTotalVenda,
    });

    resumos.push({
      mes: mesAno,
      subtipo,
      valorVenda: dados.valorTotalVenda,
      valorCompra: dados.valorTotalCompra,
      imposto
    });

    if (!somenteResumo && imposto > 0) {
      setValorVariavelDisponivel(prev => prev - imposto);

      const registroIR: RegistroHistorico = {
        tipo: 'ir',
        valor: imposto,
        categoria: 'rendaVariavel',
        subtipo: subtipo as 'acao' | 'fii' | 'criptomoeda',
        data: `${mesAno}-01`
      };

      setHistorico(prev => [...prev, registroIR]);

      const docRef = doc(db, 'usuarios', login);
      await updateDoc(docRef, {
        historico: arrayUnion(registroIR)
      });
    }
  }

  return resumos;
}