// ARQUIVO: src/components/InformarDividendosPendentesModal.tsx

import React, { useState, useMemo } from 'react';
import Button from './Button';
import { X, HandCoins } from 'lucide-react';

export interface PendenciaDividendo {
  mesApuracao: string; // Formato "YYYY-MM"
  quantidadeNaqueleMes: number;
}

export interface DividendoPreenchido {
  mesApuracao: string;
  valorPorCota: number;
}

interface Props {
  nomeFII: string;
  tickerFII: string;
  pendencias: PendenciaDividendo[];
  onClose: () => void;
  onConfirm: (dividendos: DividendoPreenchido[], senha: string) => void;
}

function formatarMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, 2);
  let nomeMes = data.toLocaleString('pt-BR', { month: 'long' });
  nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  return `${nomeMes} de ${ano}`;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) < 1e-9) value = 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function InformarDividendosPendentesModal({
  nomeFII,
  tickerFII,
  pendencias,
  onConfirm,
  onClose,
}: Props) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [senha, setSenha] = useState('');

  const handleValorChange = (mes: string, valor: string) => {
    setValores(prev => ({ ...prev, [mes]: valor }));
  };

  const creditoTotal = useMemo(() => {
    return pendencias.reduce((total, p) => {
      const valorDigitado = parseFloat((valores[p.mesApuracao] || '0').replace(',', '.'));
      const valorMes = !isNaN(valorDigitado) ? valorDigitado * p.quantidadeNaqueleMes : 0;
      return total + valorMes;
    }, 0);
  }, [valores, pendencias]);

  const handleConfirm = () => {
    if (senha.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    const dividendosPreenchidos: DividendoPreenchido[] = [];
    for (const pendencia of pendencias) {
      const valorString = valores[pendencia.mesApuracao];
      if (!valorString) {
        alert(`Por favor, preencha o valor do dividendo para ${formatarMesAno(pendencia.mesApuracao)}.`);
        return;
      }
      const valorFloat = parseFloat(valorString.replace(',', '.'));
      if (isNaN(valorFloat) || valorFloat < 0) {
        alert(`O valor digitado para ${formatarMesAno(pendencia.mesApuracao)} é inválido.`);
        return;
      }
      dividendosPreenchidos.push({
        mesApuracao: pendencia.mesApuracao,
        valorPorCota: valorFloat,
      });
    }
    onConfirm(dividendosPreenchidos, senha);
  };

  if (pendencias.length === 0) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Dividendos em Dia!</h3>
            <p className="text-sm text-gray-600 mb-4">Não há dividendos pendentes de registro para {nomeFII}.</p>
            <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">OK</Button>
          </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md flex flex-col">

        <header className="flex justify-between items-center mb-4">
          <div className="w-8"></div>
          <h2 className="text-xl font-semibold text-center">Dividendos Pendentes de {nomeFII}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors w-8">
            <X size={24} />
          </button>
        </header>
        
        <p className="text-xs text-center text-gray-500 mb-4">
          Consulte os valores em <a
            href={`https://statusinvest.com.br/fundos-imobiliarios/${tickerFII.toLowerCase().replace('.sa', '')}`}
            className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            Status Invest
          </a>
        </p>

        <ul className="space-y-4 max-h-[40vh] overflow-y-auto mb-4 text-sm p-3 bg-gray-50 rounded-lg border">
          {pendencias.map((p, i) => {
            const valorDigitado = parseFloat((valores[p.mesApuracao] || '0').replace(',', '.'));
            const valorTotalMes = !isNaN(valorDigitado) ? valorDigitado * p.quantidadeNaqueleMes : 0;

            return (
              <li key={p.mesApuracao} className="border-b pb-3 last:border-b-0">
                <p className='font-bold text-base text-center mb-3'>{formatarMesAno(p.mesApuracao)}</p>
                <div className='grid grid-cols-2 gap-x-4 gap-y-2 text-center'>
                  <div>
                    <span className="text-xs text-gray-500 block">Base de Cotas:</span>
                    <span className="font-semibold">{p.quantidadeNaqueleMes.toFixed(0)}</span>
                  </div>
                  <div>
                    <label htmlFor={`cota-${p.mesApuracao}`} className="text-xs text-gray-500 block">Valor por Cota:</label>
                    <input
                      id={`cota-${p.mesApuracao}`}
                      type="text"
                      placeholder="R$ 0,00"
                      value={valores[p.mesApuracao] || ''}
                      onChange={(e) => handleValorChange(p.mesApuracao, e.target.value)}
                      className="w-full p-1 border-b-2 border-dashed border-gray-300 text-center font-semibold bg-transparent focus:outline-none focus:border-blue-500"
                      autoFocus={i === 0}
                    />
                  </div>
                </div>

                <div className='text-center mt-3'>
                  {/* SUA SUGESTÃO APLICADA AQUI */}
                  <span className="text-xs text-gray-500 block">(=) Total a Receber em {formatarMesAno(p.mesApuracao)}:</span>
                  <span className='font-bold text-green-600'>{formatCurrency(valorTotalMes)}</span>
                </div>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-auto pt-4 border-t">
          <div className='flex justify-between items-center mt-2 mb-4 text-blue-800 font-bold bg-blue-100 p-2 rounded'>
              <span><HandCoins className="w-5 h-5 inline-block mr-2"/>Crédito Total de Dividendo:</span>
              <span className='text-lg'>{formatCurrency(creditoTotal)}</span>
          </div>

          <div className="mb-4">
            <label htmlFor="senha-dividendo-modal" className="block mb-1 font-medium">Senha (6 dígitos)</label>
            <input id="senha-dividendo-modal" type="password" value={senha} maxLength={6} onChange={(e) => setSenha(e.target.value)} placeholder="******" className="w-full p-3 border-2 border-gray-300 rounded-lg"/>
          </div>
          <div className="flex justify-between">
            <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white">Cancelar</Button>
            <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">Confirmar Dividendos</Button>
          </div>
        </div>
      </div>
    </div>
  );
}