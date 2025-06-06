// src/components/TransferenciaModal.tsx
import { useState } from 'react';
import Button from './Button';

interface TransferenciaModalProps {
  onClose: () => void;
  onConfirm: (valor: number, direcao: 'fixa-variavel' | 'variavel-fixa', senha: string) => void;
}

export default function TransferenciaModal({ onClose, onConfirm }: TransferenciaModalProps) {
  const [valor, setValor] = useState(0);
  const [direcao, setDirecao] = useState<'fixa-variavel' | 'variavel-fixa'>('fixa-variavel');
  const [senha, setSenha] = useState('');

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
      <h2 className="text-lg font-semibold mb-4 text-center">Transferência entre Contas</h2>

      <div className="mb-3">
        <label className="block font-medium mb-1">Valor</label>
        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
          min="0"
        />
      </div>

      <div className="mb-3">
        <label className="block font-medium mb-1">Direção da Transferência</label>
        <select
          value={direcao}
          onChange={(e) => setDirecao(e.target.value as any)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="fixa-variavel">Renda Fixa → Renda Variável</option>
          <option value="variavel-fixa">Renda Variável → Renda Fixa</option>
        </select>
      </div>

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
        <Button onClick={() => onConfirm(valor, direcao, senha)} className="bg-blue-600 hover:bg-blue-700 text-white">
          Transferir
        </Button>
      </div>
    </div>
  );
}
