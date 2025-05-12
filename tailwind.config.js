export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <- adiciona suporte a TypeScript
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}