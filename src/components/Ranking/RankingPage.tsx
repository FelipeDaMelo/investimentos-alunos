// Caminho: src/components/Ranking/RankingPage.tsx

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ranking } from '../../types/Ranking';
import Button from '../Button';
import CreateRankingModal from './CreateRankingModal';
import RankingDetail from './RankingDetail';
import { Trophy } from 'lucide-react';

const ADMIN_PASSWORD = "admin"; // Mude para a senha que você desejar

interface RankingPageProps {
  onBack: () => void;
}

export default function RankingPage({ onBack }: RankingPageProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<Ranking | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    const rankingsQuery = query(collection(db, "rankings"), orderBy("dataCriacao", "desc"));
    const querySnapshot = await getDocs(rankingsQuery);
    const fetchedRankings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ranking));
    setRankings(fetchedRankings);
    setLoading(false);
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const handleCreateClick = () => {
    const password = prompt("Para criar um novo ranking, por favor, insira a senha de administrador:");
    if (password === ADMIN_PASSWORD) {
      setShowCreateModal(true);
    } else if (password !== null) {
      alert("Senha incorreta!");
    }
  };

  const handleDeleteRanking = async (rankingId: string) => {
    const password = prompt("Para excluir este ranking, por favor, insira a senha de administrador:");
    if (password !== ADMIN_PASSWORD) {
      if (password !== null) alert("Senha incorreta!");
      return;
    }

    if (confirm("Você tem certeza que deseja excluir este ranking permanentemente?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, "rankings", rankingId));
        setRankings(prev => prev.filter(r => r.id !== rankingId));
        setSelectedRanking(null);
        alert("Ranking excluído com sucesso.");
      } catch (error) {
        console.error("Erro ao excluir ranking:", error);
        alert("Não foi possível excluir o ranking.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (selectedRanking) {
    return (
      <RankingDetail 
        ranking={selectedRanking} 
        onBack={() => setSelectedRanking(null)}
        onDelete={handleDeleteRanking}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 animate-fade-in">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-800">Rankings de Performance</h1>
        </div>
        <Button onClick={onBack} variant="secondary">Voltar ao Painel</Button>
      </header>

      <div className="mb-6 text-right">
        {/* ✅ A CORREÇÃO ESTÁ AQUI */}
        <Button onClick={handleCreateClick}>
          Criar Novo Ranking
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Carregando rankings...</p>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Rankings Disponíveis</h2>
          {rankings.length > 0 ? (
            rankings.map(ranking => (
              <div
                key={ranking.id}
                onClick={() => setSelectedRanking(ranking)}
                className="p-5 bg-white rounded-lg shadow-md cursor-pointer hover:shadow-lg hover:border-blue-500 border-2 border-transparent transition-all"
              >
                <h3 className="text-xl font-semibold text-blue-700">{ranking.nome}</h3>
                <p className="text-sm text-gray-600 mt-1">{ranking.participantes.length} participantes</p>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
                <p>Nenhum ranking foi criado ainda.</p>
                <p className="text-sm mt-2">Clique em "Criar Novo Ranking" para começar.</p>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateRankingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRankings();
          }}
        />
      )}
    </div>
  );
}