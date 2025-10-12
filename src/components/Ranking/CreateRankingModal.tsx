// Caminho: src/components/Ranking/CreateRankingModal.tsx

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy, documentId } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';
import Button from './../Button';
import { getAuth } from 'firebase/auth';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRankingModal({ onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));

    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
      const usersList = querySnapshot.docs.map(doc => doc.id);
      setAllUsers(usersList);
      setLoadingUsers(false);
    }, (error) => {
      console.error("Erro ao buscar usuários:", error);
      setLoadingUsers(false);
    });

    return () => unsubscribe(); // Limpa o "ouvinte" ao fechar o modal
  }, []);

  const handleToggleUser = (user: string) => {
    setSelectedUsers(prev =>
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
    );
  };

  const handleSubmit = async () => {
    if (!nome.trim() || selectedUsers.length < 2) {
      alert("O ranking precisa de um nome e pelo menos 2 participantes.");
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser; // Assumindo que o criador é o usuário logado

      await addDoc(collection(db, "rankings"), {
        nome: nome.trim(),
        participantes: selectedUsers,
        dataCriacao: new Date(),
        // Opcional: Salvar quem criou, mas precisamos do nome do grupo do usuário logado
        // criadorId: ..., 
      });
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar ranking:", error);
      alert("Não foi possível criar o ranking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Criar Novo Ranking</h2>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Nome do Ranking</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg"
            placeholder="Ex: Competição Mensal"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Selecione os Participantes</label>
          <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg p-2 space-y-1">
            {loadingUsers ? (
              <p className="text-center text-gray-500 p-4">Carregando usuários...</p>
            ) : (
              allUsers.map(user => (
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
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} variant="secondary" disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || loadingUsers}>
            {loading ? 'Criando...' : 'Confirmar e Criar Ranking'}
          </Button>
        </div>
      </div>
    </div>
  );
}