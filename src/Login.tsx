import React, { useState } from 'react';

interface LoginProps {
  onLogin: (valorInvestido: number, fixo: number, variavel: number, nomeGrupo: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [valorInvestido, setValorInvestido] = useState<string>('');
  const [fixo, setFixo] = useState<string>('');
  const [variavel, setVariavel] = useState<string>('');
  const [nomeGrupo, setNomeGrupo] = useState<string>('');
  const [erro, setErro] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErro('');

    try {
      const fixoNum = parseFloat(fixo);
      const variavelNum = parseFloat(variavel);
      const valorInvestidoNum = parseFloat(valorInvestido);

      if (isNaN(fixoNum) || isNaN(variavelNum) || isNaN(valorInvestidoNum)) {
        setErro('Por favor, insira valores numéricos válidos');
        return;
      }

      if (fixoNum + variavelNum !== 100) {
        setErro('A soma das porcentagens deve ser 100%');
        return;
      }

      if (!nomeGrupo.trim()) {
        setErro('Nome do grupo é obrigatório');
        return;
      }

      if (valorInvestidoNum <= 0) {
        setErro('Valor investido deve ser positivo');
        return;
      }

      // Adiciona pequeno delay para evitar travamentos visuais
      await new Promise(resolve => setTimeout(resolve, 100));
      onLogin(valorInvestidoNum, fixoNum, variavelNum, nomeGrupo);
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Ocorreu um erro ao processar a simulação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Configuração Inicial</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ... (campos do formulário permanecem iguais) ... */}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Iniciando...' : 'Iniciar Simulação'}
        </button>
      </form>
    </div>
  );
};

export default Login;