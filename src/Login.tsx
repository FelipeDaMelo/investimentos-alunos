// src/Login.tsx
import { useState } from 'react';

const Login = ({ onLogin }: { onLogin: (login: string) => void }) => {
  const [login, setLogin] = useState('');

  const handleSubmit = () => {
    if (login) {
      onLogin(login); // Envia o login para a página principal
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input 
        type="text" 
        placeholder="Nome do Grupo" 
        value={login} 
        onChange={(e) => setLogin(e.target.value)} 
      />
      <button onClick={handleSubmit}>Entrar</button>
    </div>
  );
};

export default Login;
