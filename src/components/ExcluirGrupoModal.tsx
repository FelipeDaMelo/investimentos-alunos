import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface Props {
  nomeGrupo: string;
  onClose: () => void;
  onConfirm: (senha: string) => void;
}

export default function ExcluirGrupoModal({ nomeGrupo, onClose, onConfirm }: Props) {
  const [senha, setSenha] = useState('');
  const [confirmText, setConfirmText] = useState('');

  const isConfirmEnabled = confirmText === nomeGrupo;

  const handleConfirm = () => {
    if (!isConfirmEnabled) {
      alert(`Você precisa digitar "${nomeGrupo}" para confirmar.`);
      return;
    }
    if (senha.length !== 6) {
      alert('A senha de 6 dígitos é obrigatória.');
      return;
    }
    onConfirm(senha);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-md">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-xl font-bold text-gray-900">Excluir Grupo?</h3>
          <p className="mt-2 text-sm text-gray-600">
            Esta ação é **permanente e irreversível**. Todos os dados de investimentos, históricos e ativos associados ao grupo
            <strong> "{nomeGrupo}"</strong> serão apagados para sempre.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="confirm-text" className="mb-4">
              Para confirmar, digite o nome do grupo: <span className="font-bold">{nomeGrupo}</span>
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              // ESTILO CORRIGIDO
              className="mt-1 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="senha-exclusao"  className="mb-4">
        <label className="block mb-1 font-medium">Senha (6 dígitos)</label>
            </label>
            <input
              id="senha-exclusao"
              type="password"
              maxLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="******"
              // ESTILO CORRIGIDO
              className="mt-1 w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={`w-full sm:w-auto ${!isConfirmEnabled ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            Tenho certeza, quero excluir permanentemente
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}