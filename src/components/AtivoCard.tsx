// src/components/AtivoCard.tsx
import React from 'react';
import { Ativo } from '../hooks/useAtualizarAtivos';

interface AtivoCardProps {
  ativo: Ativo;  // Corrija aqui a tipagem da propriedade
  onDelete: (id: string) => void;
}

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onDelete }) => {
  return (
<div>
  <h3>{ativo.nome}</h3>
  <p>Investido: R$ {ativo.valorInvestido.toFixed(2)}</p>
  <p>Data do Investimento: {ativo.dataInvestimento}</p>
  <p>Valor Atual: R$ {ativo.valorAtual.toFixed(2)}</p>

  {ativo.tipo === 'rendaFixa' && (
    <>
      <p>Categoria: {ativo.categoriaFixa}</p>
      <pre>Parâmetros: {JSON.stringify(ativo.parametrosFixa, null, 2)}</pre>
    </>
  )}

  {ativo.tipo === 'cripto' && (
    <p>Fração adquirida: {ativo.fracaoAdquirida.toFixed(6)}</p>
  )}

  <button onClick={() => onDelete(ativo.id)}>Excluir</button>
</div>
  );
};

export default AtivoCard;
