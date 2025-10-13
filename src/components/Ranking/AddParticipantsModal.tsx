// Caminho: src/components/Ranking/AddParticipantsModal.tsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import Button from '../Button';

interface Props {
  onClose: () => void;
  onConfirm: (newParticipants: string[]) => void;
  currentParticipants: string[]; // Recebe a lista de quem já está no ranking
}

export default function AddParticipantsModal({ onClose, onConfirm, currentParticipants }: Props) {
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));

    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const allUsers = querySnapshot.docs.map(doc => doc.id);
      
      // Filtra para mostrar apenas usuários que NÃO estão no ranking atual
      const usersToAdd = allUsers.filter(user => !currentParticipants.includes(user));
      
      setAvailableUsers(usersToAdd);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentParticipants]); // Depende dos participantes atuais para filtrar corretamente

  const handleToggleUser = (user: string) => {
    setSelectedUsers(prev =>
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
    );
  };

  const handleSubmit = () => {
    if (selectedUsers.length === 0) {
      alert("Selecione pelo menos um novo participante.");
      return;
    }
    onConfirm(selectedUsers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Adicionar Novos Participantes</h2>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Selecione os usuários a serem adicionados</label>
          <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 space-y-1">
            {loading ? (
              <p className="text-center text-gray-500 p-4">Carregando usuários...</p>
            ) : availableUsers.length > 0 ? (
              availableUsers.map(user => (
                <label key={user} className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user)}
                    onChange={() => handleToggleUser(user)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 font-medium text-gray-700">{user}</span>
                </label>
              ))
            ) : (
                <p className="text-center text-gray-500 p-4">Todos os usuários já estão neste ranking.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSubmit}>Adicionar Selecionados</Button>
        </div>
      </div>
    </div>
  );
}