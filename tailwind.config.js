// Caminho: tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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