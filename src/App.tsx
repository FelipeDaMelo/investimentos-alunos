// src/App.tsx
import React, { useState } from 'react';
import Login from './Login';
import MainPage from './MainPage';

const App = () => {
  const [login, setLogin] = useState<string | null>(null);

  const handleLogin = (login: string) => {
    setLogin(login);
  };

  return (
    <div>
      {!login ? (
        <Login onLogin={handleLogin} />
      ) : (
        <MainPage login={login} />
      )}
    </div>
  );
};

export default App;
