import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function Button({ children, variant = 'primary', ...props }: ButtonProps) {
  const baseStyles = "font-bold py-3 px-6 rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300";

  const variantStyles = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-300 hover:bg-gray-400 text-gray-700",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${props.className || ''}`}
    >
      {children}
    </button>
  );
}
