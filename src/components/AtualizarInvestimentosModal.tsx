import React, { useState } from 'react';
import Button from './Button';

interface Props {
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function AtualizarInvestimentosModal({ onClose, onConfirm }: Props) {
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
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg">
        <h2 className="text-lg font-semibold mb-4 text-center">Atualizar Investimentos</h2>

        <p className="text-sm text-gray-700 mb-4 text-justify">
          Esta ação atualizará os valores dos ativos. Após a execução, será necessário aguardar <strong>60 segundos</strong> para nova atualização. A <strong>renda fixa</strong> só poderá ser atualizada novamente após <strong>24 horas</strong>.
        </p>

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
          <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">Cancelar</Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">Confirmar Atualização</Button>
        </div>
      </div>
    </div>
  );
}
