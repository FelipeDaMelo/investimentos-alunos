import { ResumoIR } from './ResumoIR';

interface Props {
  resumosIR: ResumoIR[];
  onClose: () => void;
}

export default function ResumoIRModal({ resumosIR, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow w-full max-w-xl">
        <h2 className="text-lg font-semibold mb-4 text-center">Resumo do Imposto de Renda</h2>
        <ul className="space-y-3 max-h-[400px] overflow-y-auto">
          {resumosIR.map((r, i) => (
            <li key={i} className="border-b pb-2">
              <p><strong>Mês:</strong> {r.mes}</p>
              <p><strong>Subtipo:</strong> {r.subtipo}</p>
              <p><strong>Total Vendido:</strong> R$ {r.valorVenda.toFixed(2)}</p>
              <p><strong>Lucro:</strong> R$ {(r.valorVenda - r.valorCompra).toFixed(2)}</p>
              <p><strong>IR Devido:</strong> R$ {r.imposto.toFixed(2)}</p>
            </li>
          ))}
        </ul>
        <div className="text-center mt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}