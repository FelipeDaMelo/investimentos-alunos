import React, { useRef } from 'react';
import Button from './Button';
import html2pdf from 'html2pdf.js';

interface HistoricoItem {
  tipo: 'deposito' | 'compra' | 'venda';
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
  venda: 'text-green-600'
};

export default function HistoricoModal({ historico, onClose }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);

  const exportarPDF = () => {
    if (modalRef.current) {
      const hoje = new Date();
      const dia = String(hoje.getDate()).padStart(2, '0');
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const ano = hoje.getFullYear();
      const nomeArquivo = `historico-${dia}-${mes}-${ano}.pdf`;

      html2pdf()
        .from(modalRef.current)
        .set({
          margin: 1,
          filename: nomeArquivo,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        })
        .save();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
      <div ref={modalRef}>
        <h2 className="text-xl font-semibold mb-4 text-center">Histórico de Transações</h2>
        <div className="max-h-[400px] overflow-y-auto overflow-x-auto px-2">
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
