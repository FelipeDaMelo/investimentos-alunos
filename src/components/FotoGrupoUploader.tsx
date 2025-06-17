// Caminho: src/components/FotoGrupoUploader.tsx
// ✅ VERSÃO FINAL CORRETA E AUTOCONTIDA

import React, { useState, useRef } from 'react';
import { Pencil, Camera } from 'lucide-react'; // Importar Camera para o placeholder
import Button from './Button'; // Importar seu componente de Botão

// 1. Definição de Props: O que este componente precisa receber da MainPage
interface FotoGrupoUploaderProps {
  login: string;
  fotoUrlAtual?: string;
  // A única prop necessária é a função que faz a lógica de negócio na MainPage
  onConfirmUpload: (file: File, senhaDigitada: string) => Promise<void>;
}

export default function FotoGrupoUploader({
  login,
  fotoUrlAtual,
  onConfirmUpload,
}: FotoGrupoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para controlar o modal que vive DENTRO deste componente
  const [showModal, setShowModal] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  // Função para abrir a janela de seleção de arquivo
  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  // Quando o usuário seleciona um arquivo, apenas armazena e abre o modal.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoSelecionado(file);
      setShowModal(true);
      setSenhaDigitada(''); // Limpa a senha anterior
    }
  };

  // Função chamada pelo botão "Confirmar" do nosso modal.
  const handleConfirmarAcao = async () => {
    if (!arquivoSelecionado) return;

    if (senhaDigitada.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }

    setIsUploading(true);
    try {
      // Chama a função da MainPage, passando o arquivo e a senha
      await onConfirmUpload(arquivoSelecionado, senhaDigitada);
      // Se a função na MainPage for bem-sucedida, ela não lançará erro, então podemos fechar o modal.
      setShowModal(false);
    } catch (error) {
      // Se a função na MainPage lançar um erro (ex: senha incorreta),
      // o 'alert' já foi mostrado lá. O modal permanecerá aberto para nova tentativa.
      console.error("Falha na confirmação do upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-20 h-20 group">
      {/* Input de arquivo escondido */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {/* Exibe a foto atual ou um placeholder */}
      <img
        src={fotoUrlAtual || '/usuario-placeholder.png'}
        alt="Foto do grupo"
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
      />
      
      {/* Ícone de lápis para editar */}
      <button
        onClick={handleEditClick}
        className="absolute bottom-0 right-0 bg-blue-600 p-1.5 rounded-full shadow-lg hover:bg-blue-700 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
        title="Editar foto"
        disabled={isUploading}
      >
        <Pencil className="w-4 h-4 text-white" />
      </button>

      {/* ---- O JSX do Modal, renderizado condicionalmente ---- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Alterar Foto do Grupo</h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              Digite sua senha de 6 dígitos para confirmar o envio da nova imagem.
            </p>
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700 sr-only">Senha (6 dígitos)</label>
<input
    type="password"
    value={senhaDigitada}
    onChange={(e) => setSenhaDigitada(e.target.value)}
    maxLength={6}
    className="w-full p-3 border-2 border-gray-300 rounded-lg text-center text-lg tracking-widest focus:border-blue-500 focus:ring-blue-200 
               text-gray-900     // ✅ Garante que o texto (e os asteriscos) seja preto/cinza escuro.
               placeholder-gray-400 // ✅ Estiliza a cor do placeholder *****.
              "
    placeholder="******"
    autoFocus
/>
            </div>
    
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white w-full"
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarAcao}
                disabled={isUploading || senhaDigitada.length !== 6}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                {isUploading ? 'Enviando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}