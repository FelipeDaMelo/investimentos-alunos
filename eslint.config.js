import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { ESLint } from 'eslint'

export default {
  ignores: ['dist'],
  extends: [
    js.configs.recommended,
    'plugin:@typescript-eslint/recommended',  // Adicionando recomendação do TypeScript
    'plugin:react/recommended',  // Adicionando recomendação do React
    'plugin:react-hooks/recommended', // Adicionando recomendação dos hooks do React
  ],
  parser: '@typescript-eslint/parser',  // Usando o parser do TypeScript
  parserOptions: {
    ecmaVersion: 2020,  // Configuração para ECMAScript 2020
    sourceType: 'module',  // Usando módulos ES
  },
  files: ['**/*.{ts,tsx}'],
  globals: {
    ...globals.browser,  // Configura variáveis globais do navegador
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),  // Plugin do TypeScript
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    ...reactHooks.configs.recommended.rules,
    // Outras regras do ESLint podem ser adicionadas aqui
  },
}
