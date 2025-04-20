// src/components/ui/Spinner.tsx
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export default function Spinner({ size = 'medium' }: SpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} animate-spin rounded-full border-2 border-solid border-current border-r-transparent`} />
  );
}