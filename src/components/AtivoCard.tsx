import React from 'react';
import { Ativo } from '../MainPage'; // Importe o tipo 'Ativo' da MainPage

interface AtivoCardProps {
  ativo: Ativo;  // Corrija aqui a tipagem da propriedade
  onDelete: (id: string) => void;
}

const AtivoCard: React.FC<AtivoCardProps> = ({ ativo, onDelete }) => {
  return (
    <div>
      <h3>{ativo.nome}</h3>
      <p>Investido: {ativo.valorInvestido}</p>
      <p>Data do Investimento: {ativo.dataInvestimento}</p>
      <p>Valor Atual: {ativo.valorAtual}</p>
      <button onClick={() => onDelete(ativo.id)}>Excluir</button>
    </div>
  );
};

export default AtivoCard;
