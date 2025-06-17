import React, { useRef } from 'react';
import Button from './Button';
import html2pdf from 'html2pdf.js';

interface HistoricoItem {
  tipo: 'deposito' | 'compra' | 'venda' | 'dividendo'| 'transferencia' | 'ir';
  valor: number;
  destino?: 'fixa' | 'variavel';
  nome?: string;
  data: string;
  valorBruto?: number;
  valorLiquido?: number;
  imposto?: number;
  diasAplicado?: number;
  categoria?: 'rendaFixa' | 'rendaVariavel';
}

interface Props {
  historico: HistoricoItem[];
  onClose: () => void;
}

const corPorTipo = {
  deposito: 'text-blue-600',
  compra: 'text-red-600',
  venda: 'text-green-600',
  dividendo: 'text-purple-600', // nova cor para dividendos
  transferencia: 'text-gray-600' ,
  ir: 'text-green-600'
};

export default function HistoricoModal({ historico, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

 const exportarPDF = () => {
  if (modalRef.current) {
    const scrollable = modalRef.current.querySelector('.historico-scroll') as HTMLDivElement;
    const originalStyle = scrollable?.getAttribute('style') || '';

    scrollable.setAttribute(
      'style',
      'max-height: none; overflow: visible; height: auto; position: static;'
    );

    const hoje = new Date();
    const nomeArquivo = `Extrato_Transacao_${hoje.toLocaleDateString('pt-BR')}.pdf`;

    html2pdf()
      .from(modalRef.current)
      .set({
        margin: 1,
        filename: nomeArquivo,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
      })
      .save()
      .then(() => {
        scrollable.setAttribute('style', originalStyle); // restaura o estilo
      });
  }
};

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg shadow-lg">
      <div ref={modalRef}>
        <h2 className="text-xl font-semibold mb-4 text-center">Extrato de Transações</h2>
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto px-2 historico-scroll">
          <ul className="space-y-2 text-center">
            {historico.map((item, i) => (
              <li
                key={i}
                className={`font-medium ${corPorTipo[item.tipo]} whitespace-nowrap`}
              >
                {item.tipo === 'deposito' &&
                  `Depósito: ${item.valor.toFixed(2)} reais em Renda ${item.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
                {item.tipo === 'compra' &&
                  `Compra: ${item.valor.toFixed(2)} reais em "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
              {item.tipo === 'venda' ? (
  item.categoria === 'rendaFixa' ? (
    <>
      Resgate: {item.valorBruto?.toFixed(2)} brutos de "{item.nome}" no dia {new Date(item.data).toLocaleDateString('pt-BR')} —
      IR: {item.imposto?.toFixed(2)} —
      Líquido: {item.valorLiquido?.toFixed(2)}
    </>
  ) : (
    `Venda: ${item.valor.toFixed(2)} reais em "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`
  )
) : null}
                  {item.tipo === 'dividendo' &&
                  `Dividendo: ${item.valor.toFixed(2)} reais recebidos de "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
              {item.tipo === 'transferencia' &&
      `Transferência: ${item.valor.toFixed(2)} reais para Renda ${item.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
  </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button onClick={exportarPDF} className="bg-gray-600 hover:bg-gray-700 text-white">
          Exportar PDF
        </Button>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
}
