// Caminho: tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {

      animation: {
        'text-pulse': 'text-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'text-shine': 'text-shine 3s linear infinite',
      },
      keyframes: {
        'text-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'text-shine': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },

      fontFamily: {
        // Adiciona a fonte Poppins como principal
        sans: ['Poppins', 'sans-serif', 'Inter'],
      },
      colors: {
        // Paleta de cores inspirada no Marista
        'marista-blue': {
          DEFAULT: '#0075c9', // Azul principal do logo
          dark: '#005b9e',
          light: '#e6f3fc',
        },
        'primary': '#0075c9', // Alias para a cor principal
        'secondary': '#f3f4f6', // Cinza claro
        'accent': '#f59e0b', // Um amarelo/laranja para destaque
      },
    },
  },
  plugins: [],
}