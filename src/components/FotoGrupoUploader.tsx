// Caminho: src/components/FotoGrupoUploader.tsx

import React, { useState, useRef } from 'react';
import { Pencil, Camera, Trash2 } from 'lucide-react'; // Importamos os ícones necessários
import Button from './Button'; 

// A interface de props agora recebe a nova função para abrir o modal de exclusão
interface FotoGrupoUploaderProps {
  login: string;
  fotoUrlAtual?: string;
  onConfirmUpload: (file: File, senhaDigitada: string) => Promise<void>;
  onTriggerDelete: () => void; // Prop para avisar a MainPage para abrir o modal de exclusão
}

export default function FotoGrupoUploader({
  login,
  fotoUrlAtual,
  onConfirmUpload,
  onTriggerDelete,
}: FotoGrupoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- Estados de Controle ---
  const [showMenu, setShowMenu] = useState(false); // NOVO: para controlar o menu
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Funções de Ação do Menu ---
  const handleAlterarFotoClick = () => {
    setShowMenu(false); // Fecha o menu
    fileInputRef.current?.click(); // Abre o seletor de arquivos
  };

  const handleExcluirGrupoClick = () => {
    setShowMenu(false); // Fecha o menu
    onTriggerDelete(); // Chama a função da MainPage
  };

  // --- Lógica de Upload (do seu código original) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoSelecionado(file);
      setShowUploadModal(true); // Abre o modal de confirmação de upload
      setSenhaDigitada('');
    }
  };

  const handleConfirmarUpload = async () => {
    if (!arquivoSelecionado || senhaDigitada.length !== 6) {
      alert('A senha deve conter 6 dígitos.');
      return;
    }
    setIsUploading(true);
    try {
      await onConfirmUpload(arquivoSelecionado, senhaDigitada);
      setShowUploadModal(false);
    } catch (error) {
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
      
      {/* Gatilho Visual: A foto ou placeholder. Clicar aqui abre o menu. */}
      <button
        type="button"
        onClick={() => setShowMenu(true)}
        className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer block"
        aria-label="Abrir menu de opções do grupo"
      >
        <img
          src={fotoUrlAtual || '/usuario-placeholder.png'}
          alt="Foto do grupo"
          className="w-full h-full object-cover"
        />
        {/* Efeito de sobreposição com lápis */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-all duration-300">
          <Pencil className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </button>

      {/* --- O NOVO MENU DROPDOWN --- */}
      {showMenu && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white rounded-lg shadow-xl z-50 py-2 animate-fade-in-down">
            <button
              onClick={handleAlterarFotoClick}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
            >
              <Camera size={16} /> Alterar Foto
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={handleExcluirGrupoClick}
              className="w-full text-left px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-3 transition-colors"
            >
              <Trash2 size={16} /> Excluir Grupo
            </button>
          </div>
        </>
      )}

      {/* --- O MODAL DE UPLOAD (seu código original, agora controlado por 'showUploadModal') --- */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Alterar Foto do Grupo</h3>
            <p className="text-sm text-center text-gray-600 mb-6">
              Digite sua senha de 6 dígitos para confirmar o envio da nova imagem.
            </p>
            <div className="mb-6">
              <input
                type="password"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                maxLength={6}
                className="w-full p-3 border-2 border-gray-300 rounded-lg text-center text-lg tracking-widest focus:border-blue-500 focus:ring-blue-200 text-gray-900 placeholder-gray-400"
                placeholder="******"
                autoFocus
              />
            </div>
            <div className="flex justify-between gap-4">
              <Button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white w-full"
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmarUpload}
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