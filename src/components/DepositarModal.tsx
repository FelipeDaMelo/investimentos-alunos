import React, { useState } from 'react';
import Button from './Button';

interface DepositarModalProps {
  onClose: () => void;
  onConfirm: (valor: number, destino: 'fixa' | 'variavel', senha: string) => void;
}

export default function DepositarModal({ onClose, onConfirm }: DepositarModalProps) {
  const [valor, setValor] = useState('');
  const [destino, setDestino] = useState<'fixa' | 'variavel'>('fixa');
  const [senha, setSenha] = useState('');

  const handleSubmit = () => {
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!isNaN(valorNumerico) && senha.length === 6) {
      onConfirm(valorNumerico, destino, senha);
    } else {
      alert('Verifique o valor e a senha');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-xl font-semibold mb-4">Depositar</h2>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Valor (R$)</label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
          placeholder="Ex: 1000"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Destino</label>
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value as 'fixa' | 'variavel')}
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        >
          <option value="fixa">Renda Fixa</option>
          <option value="variavel">Renda Variável</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Senha (6 dígitos)</label>
        <input
          type="password"
          value={senha}
          maxLength={6}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} className="bg-blue-600 text-white hover:bg-blue-700">
          Confirmar
        </Button>
      </div>
    </div>
  );
}
