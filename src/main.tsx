import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter } from 'react-router-dom'; // ✅ 1. Importe o BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter> {/* ✅ 2. Envolva o <App /> aqui */}
    <App />
    </BrowserRouter>
  </StrictMode>,
)
