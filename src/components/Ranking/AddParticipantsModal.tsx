// Caminho: src/components/Ranking/AddParticipantsModal.tsx

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserPlus, X, Check, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: (newParticipants: string[]) => void;
  currentParticipants: string[]; // Recebe a lista de quem já está no ranking
}

interface UserData {
  id: string;
  fotoGrupo: string | null;
}

export default function AddParticipantsModal({ onClose, onConfirm, currentParticipants }: Props) {
  const [availableUsers, setAvailableUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredUsers = availableUsers.filter(user => user.id.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersList: UserData[] = snapshot.docs
        .filter(doc => !currentParticipants.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          fotoGrupo: doc.data().fotoGrupo || null
        }));
      
      setAvailableUsers(usersList);
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
    <div className="flex flex-col bg-white h-full relative">
      <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Adicionar Participantes</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Gestão de Ranking</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </header>

      <main className="p-8 flex-1 flex flex-col min-h-0 space-y-6">
        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between shrink-0">
            <span>Usuários Disponíveis</span>
            <span className="text-blue-600">{selectedUsers.length} selecionados</span>
          </label>
          <div className="flex-1 min-h-[300px] overflow-hidden border-2 border-slate-100 rounded-[1.5rem] bg-slate-50 flex flex-col">
            <div className="p-3 border-b border-slate-200/60 shrink-0 bg-white">
              <div className="flex border-2 border-slate-100 rounded-xl overflow-hidden group focus-within:border-blue-500 transition-colors bg-slate-50">
                <div className="w-10 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={16} />
                </div>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar grupos..."
                  className="w-full bg-transparent py-2 pr-4 text-sm text-slate-800 font-bold focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 overflow-y-auto custom-scrollbar flex-1 content-start">
              {loading ? (
                <p className="col-span-full text-center text-slate-400 p-4 text-sm font-bold">Carregando usuários...</p>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <label key={user.id} onClick={() => handleToggleUser(user.id)} className="flex items-center justify-between p-3 rounded-xl hover:bg-white cursor-pointer transition-colors group border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={user.fotoGrupo || "/logo-marista.png"} alt={user.id} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0" />
                      <span className={`font-bold truncate transition-colors ${selectedUsers.includes(user.id) ? 'text-slate-800' : 'text-slate-600'}`}>{user.id}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ml-2 ${selectedUsers.includes(user.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                      {selectedUsers.includes(user.id) && <Check size={14} strokeWidth={3} />}
                    </div>
                  </label>
                ))
              ) : (
                  <p className="col-span-full text-center text-slate-400 p-4 text-sm font-medium">Nenhum grupo encontrado.</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-auto">
        <button 
          onClick={onClose}
          className="px-6 py-4 bg-white text-slate-500 border-2 border-slate-200 rounded-2xl font-black tracking-tight hover:bg-slate-100 transition-all active:scale-95 w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSubmit}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 w-full sm:w-auto disabled:opacity-50 flex items-center gap-2"
          disabled={selectedUsers.length === 0}
        >
          Adicionar Selecionados
        </button>
      </footer>
    </div>
  );
}