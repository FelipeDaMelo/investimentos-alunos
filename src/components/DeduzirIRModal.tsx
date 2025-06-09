import { useState } from 'react';
import { ResumoIR } from './ResumoIR';
import Button from './Button';

interface Props {
  resumosIR: ResumoIR[];
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function DeduzirIRModal({ resumosIR, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    onConfirm(senha);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4 text-center">Resumo do Imposto de Renda</h2>

        {resumosIR.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mb-4">
            Nenhuma venda tributável registrada nos últimos meses.
          </p>
        ) : (
          <ul className="space-y-3 max-h-[300px] overflow-y-auto mb-4 text-sm">
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
        )}

        <div className="mb-4">
          <label className="block mb-1 font-medium">Senha (6 dígitos)</label>
          <input
            type="password"
            value={senha}
            maxLength={6}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="******"
            className="w-full p-3 border-2 border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex justify-between">
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
            Confirmar Dedução
          </Button>
        </div>
      </div>
    </div>
  );
}
