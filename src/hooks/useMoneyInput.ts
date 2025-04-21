//src/hooks/useMoneyInput.ts
import { useState } from 'react';

const useMoneyInput = (initialValue: number) => {
  const [value, setValue] = useState(initialValue);
  const [displayValue, setDisplayValue] = useState(
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(initialValue)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseFloat(rawValue) / 100 || 0;
    setValue(numericValue);
    setDisplayValue(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numericValue)
    );
  };

  return {
    value,
    displayValue,
    handleChange,
    setValue
  };
};

export default useMoneyInput;