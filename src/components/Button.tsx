import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'; // ✅ Adicionado 'danger'
}

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300';

  const variantStyles: Record<string, string> = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white', // ✅ Estilo vermelho para botão de fechar
  };

  return (
    <button
      type={type}
      {...props}
      className={`${baseStyles} ${variantStyles[variant ?? 'primary']} ${className}`}
    >
      {children}
    </button>
  );
}
