// Caminho: src/components/Ranking/CreateRankingModal.tsx

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy, documentId } from 'firebase/firestore'; 
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { Trophy, X, Check, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface UserData {
  id: string;
  fotoGrupo: string | null;
}

export default function CreateRankingModal({ onClose, onSuccess }: Props) {
  const [nome, setNome] = useState('');
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const filteredUsers = allUsers.filter(user => user.id.toLowerCase().includes(searchTerm.toLowerCase()));

  useEffect(() => {
    const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      try {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          fotoGrupo: doc.data().fotoGrupo || null
        }));
        setAllUsers(usersList);
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      } finally {
        setLoadingUsers(false);
      }
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
    <div className="flex flex-col bg-white h-full relative">
      <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Criar Novo Ranking</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Ambiente de Competição</p>
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
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nome do Ranking</label>
          <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-colors bg-slate-50">
            <div className="w-14 flex items-center justify-center bg-slate-100 text-slate-400 border-r-2 border-slate-100 group-focus-within:text-blue-500 group-focus-within:border-blue-100 transition-colors">
              <Trophy size={20} />
            </div>
            <input 
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Competição Mensal"
              className="w-full bg-transparent px-4 py-4 text-slate-800 font-bold focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2 flex-1 flex flex-col min-h-0">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between shrink-0">
            <span>Selecione os Participantes</span>
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
              {loadingUsers ? (
                <p className="col-span-full text-center text-slate-400 p-4 text-sm font-bold">Carregando usuários...</p>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <label key={user.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white cursor-pointer transition-colors group border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={user.fotoGrupo || "/logo-marista.png"} alt={user.id} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
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
          disabled={loading}
          className="px-6 py-4 bg-white text-slate-500 border-2 border-slate-200 rounded-2xl font-black tracking-tight hover:bg-slate-100 transition-all active:scale-95 w-full sm:w-auto"
        >
          Cancelar
        </button>
        <button 
          onClick={handleSubmit}
          disabled={loading || loadingUsers}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95 w-full sm:w-auto disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Criando...' : 'Criar Ranking'}
        </button>
      </footer>
    </div>
  );
}