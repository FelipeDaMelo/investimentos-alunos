import React, { useState } from 'react';
import Button from './Button';

interface Props {
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function AtualizarInvestimentosModal({ onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">Atualizar Investimentos</h2>
        <p className="mb-4 text-gray-700">
          Esta ação atualizará os valores dos ativos. <br />
          Após a execução, será necessário aguardar <strong>30 minutos</strong> para nova atualização. <br />
          A <strong>renda fixa</strong> só poderá ser atualizada novamente após <strong>24 horas</strong>.
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Senha (6 dígitos)
        </label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="******"
          className="w-full border rounded px-3 py-2 mb-4"
        />
        <div className="flex justify-end gap-3">
          <Button className="bg-gray-400 text-white" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-blue-600 text-white" onClick={() => onConfirm(senha)}>
            Confirmar Atualização
          </Button>
        </div>
      </div>
    </div>
  );
}
