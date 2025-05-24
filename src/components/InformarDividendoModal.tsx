import React, { useState } from 'react';
import Button from './Button';
import { RendaVariavelAtivo } from '../types/Ativo';

  interface Props {
  nome: string;
  ticker: string;
  ativo: RendaVariavelAtivo;
  onClose: () => void;
  onConfirm: (valor: number, senha: string) => void;
  jaInformadoEsteMes: boolean;
}

export default function InformarDividendoModal({ ativo, nome, ticker, onConfirm, onClose, jaInformadoEsteMes }: Props) {
  const [valor, setValor] = useState('');
  const [senha, setSenha] = useState('');

  const handleConfirm = () => {
    const valorFloat = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorFloat) || valorFloat <= 0) {
      alert('Digite um valor válido para o dividendo.');
      return;
    }
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    const hoje = new Date();
    if (hoje.getDate() < 15) {
      alert('Dividendo só pode ser informado após o dia 15 do mês.');
      return;
    }

    if (jaInformadoEsteMes) {
      alert('O dividendo já foi informado para este FII neste mês.');
      return;
    }

    onConfirm(valorFloat, senha);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4 text-center">Informar Dividendo</h2>

      <p className="text-sm mb-3 text-center">
        Consulte o dividendo mais recente de <strong>{nome}</strong> em:<br />
        <a
            href={`https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase().replace('.sa', '')}`}
          className="text-blue-600 underline"
          target="_blank" rel="noopener noreferrer"
        >
          statusinvest.com.br/fundos-imobiliarios/{ticker.toLowerCase()}
        </a>
      </p>

      <div className="mb-4">
        <label className="block font-medium mb-1">Valor do Dividendo (por cota)</label>
        <input
          type="text"
          placeholder="Ex: 0,12"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Senha (6 dígitos)</label>
        <input
          type="password"
          maxLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} className="bg-indigo-600 text-white hover:bg-indigo-700">
          Confirmar
        </Button>
      </div>
    </div>
  );
}
