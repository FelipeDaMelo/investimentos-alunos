// src/components/AtivoCard.tsx
import { FC } from 'react';

interface AtivoCardProps {
  id: string;
  nome: string;
  valorInvestido: number;
  dataInvestimento: string;
  valorAtual: string | number;
  onDelete: (id: string) => void;
  formatarData: (dataISO: string) => string;
}

const AtivoCard: FC<AtivoCardProps> = ({
  id,
  nome,
  valorInvestido,
  dataInvestimento,
  valorAtual,
  onDelete,
  formatarData,
}) => {
  return (
    <div>
      <h3>{nome}</h3>
      <p>Investido: {valorInvestido}</p>
      <p>Data do Investimento: {formatarData(dataInvestimento)}</p>
      <p>Valor Atual: {valorAtual}</p>
      <button onClick={() => onDelete(id)}>Excluir</button>
    </div>
  );
};

export default AtivoCard;
