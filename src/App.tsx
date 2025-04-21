import React, { useState, useCallback } from 'react';
import Login from './Login';
import MainPage from './MainPage';
import { GrupoInvestimento } from './types/Ativo';

const App = () => {
  const [grupo, setGrupo] = useState<GrupoInvestimento | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback((grupoData: GrupoInvestimento) => {
    setGrupo(grupoData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {!grupo ? (
        <Login 
          onLogin={handleLogin} 
          onLoading={setLoading} 
        />
      ) : (
        <MainPage 
          grupo={grupo}
          onLogout={() => setGrupo(null)}
        />
      )}
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse"></div>
              <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-75"></div>
              <div className="w-4 h-4 rounded-full bg-blue-600 animate-pulse delay-150"></div>
            </div>
            <p className="mt-2 text-lg font-medium">Carregando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;