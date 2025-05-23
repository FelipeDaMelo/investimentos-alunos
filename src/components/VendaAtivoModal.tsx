import { useState } from 'react';
import { Ativo } from '../types/Ativo';
import Button from './Button';

interface VendaAtivoModalProps {
  ativo: Ativo;
  onConfirm: (quantidadeVendida: number, senha: string) => void;
  onClose: () => void;
}

export default function VendaAtivoModal({ ativo, onConfirm, onClose }: VendaAtivoModalProps) {
  const [quantidade, setQuantidade] = useState('');
  const [senha, setSenha] = useState('');

  const isRendaVariavel = ativo.tipo === 'rendaVariavel';

  const handleConfirm = () => {
    const quantidadeNumerica = parseFloat(quantidade.replace(',', '.'));

    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    if (isRendaVariavel) {
      if (isNaN(quantidadeNumerica) || quantidadeNumerica <= 0 || quantidadeNumerica > (ativo as any).quantidade) {
        alert('Quantidade inválida.');
        return;
      }
    }

    onConfirm(isRendaVariavel ? quantidadeNumerica : 1, senha);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-sm w-full space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 hover:scale-110 transform transition-all duration-200 shadow-sm rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold">Vender {ativo.nome}</h2>

        {isRendaVariavel ? (
          <>
            <p className="text-sm text-gray-600">
              Quantidade disponível: {(ativo as any).quantidade.toFixed(2)}
            </p>
            <input
              type="text"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade a vender"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              autoFocus
            />
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Esta venda irá devolver {ativo.valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para o caixa.
          </p>
        )}

        <div>
          <label className="block mb-1 font-medium">Senha (6 dígitos)</label>
          <input
            type="password"
            value={senha}
            maxLength={6}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg"
            placeholder="******"
          />
        </div>

        <Button onClick={handleConfirm} className="w-full">
            {ativo.tipo === 'rendaFixa' ? 'Confirmar Resgate' : 'Confirmar Venda'}
          </Button>
      </div>
    </div>
  );
}
