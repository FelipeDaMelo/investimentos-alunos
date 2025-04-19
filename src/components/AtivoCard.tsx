import React from 'react';
import { Ativo } from '../types/Ativo';

interface AtivoCardProps {
  ativo: Ativo;
  onDelete: (id: string) => void;
}

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onDelete }) => {
  return (
    <div className="border p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg">{ativo.nome}</h3>
      <p>Investido: R$ {ativo.valorInvestido.toFixed(2)}</p>
      <p>Data: {new Date(ativo.dataInvestimento).toLocaleDateString()}</p>
      <p>Valor Atual: R$ {ativo.valorAtual.toFixed(2)}</p>

      {ativo.tipo === 'rendaFixa' && (
        <>
          <p>Categoria: {ativo.categoriaFixa}</p>
          {ativo.parametrosFixa && (
            <div className="mt-2">
              <p className="font-semibold">Parâmetros:</p>
              <pre className="text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(ativo.parametrosFixa, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {ativo.tipo === 'cripto' && (
        <p>Fração: {ativo.fracaoAdquirida.toFixed(6)}</p>
      )}

      <button
        onClick={() => onDelete(ativo.id)}
        className="mt-3 bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
      >
        Excluir
      </button>
    </div>
  );
};

export default AtivoCard;