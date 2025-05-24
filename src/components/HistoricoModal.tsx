import React, { useRef } from 'react';
import Button from './Button';
import html2pdf from 'html2pdf.js';

interface HistoricoItem {
  tipo: 'deposito' | 'compra' | 'venda' | 'dividendo';
  valor: number;
  destino?: 'fixa' | 'variavel';
  nome?: string;
  data: string;

}

interface Props {
  historico: HistoricoItem[];
  onClose: () => void;
}

const corPorTipo = {
  deposito: 'text-blue-600',
  compra: 'text-red-600',
  venda: 'text-green-600',
  dividendo: 'text-purple-600' // nova cor para dividendos
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
    const nomeArquivo = `historico-${hoje.toLocaleDateString('pt-BR')}.pdf`;

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
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
      <div ref={modalRef}>
        <h2 className="text-xl font-semibold mb-4 text-center">Histórico de Transações</h2>
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto px-2 historico-scroll">
          <ul className="space-y-2 text-center">
            {historico.map((item, i) => (
              <li
                key={i}
                className={`font-medium ${corPorTipo[item.tipo]} whitespace-nowrap`}
              >
                {item.tipo === 'deposito' &&
                  `Depósito: ${item.valor} reais em Renda ${item.destino === 'fixa' ? 'Fixa' : 'Variável'} no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
                {item.tipo === 'compra' &&
                  `Compra: ${item.valor} reais em "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
                {item.tipo === 'venda' &&
                  `Venda: ${item.valor} reais em "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
                  {item.tipo === 'dividendo' &&
                  `Dividendo: ${item.valor} reais recebidos de "${item.nome}" no dia ${new Date(item.data).toLocaleDateString('pt-BR')}`}
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
