// Caminho do arquivo: src/components/Admin/AdminPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';
import Button from '../Button';
import UserSummaryCard, { UserData } from './UserSummaryCard';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

const ADMIN_PASSWORD = "admin";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allUsersData, setAllUsersData] = useState<UserData[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const password = prompt("Por favor, insira a senha de administrador:");
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Senha incorreta! Acesso negado.");
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

 const fetchAllUsers = async () => {
      setLoading(true);
      const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));
      const querySnapshot = await getDocs(usersQuery);
      
      const processedData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // ✅ AQUI ESTÁ A MUDANÇA
        // Agora, a função apenas extrai os dados já calculados e salvos pela MainPage.
        const { valorTotalAtual, rentabilidade } = calculateUserMetrics(data);
        
        return {
          id: doc.id,
          valorTotalAtual,
          rentabilidade,
          historico: data.historico || [],
        };
      });
      
      processedData.sort((a, b) => b.rentabilidade - a.rentabilidade);
      setAllUsersData(processedData);
      setSelectedUserIds([]); // Inicia com o array vazio
      setLoading(false);
    };

    fetchAllUsers();
  }, [isAuthenticated]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = useMemo(() => 
    allUsersData.filter(user => selectedUserIds.includes(user.id)),
    [allUsersData, selectedUserIds]
  );

    const handleExportSinglePDF = async (user: UserData) => {
        setExportingId(user.id);
        console.log(`Iniciando exportação para: ${user.id}`);

    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Extrato de Transações", 14, 22);
        doc.setFontSize(14);
        doc.text(`Grupo: ${user.id}`, 14, 30);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, 14, 36);

        console.log("Cabeçalho do PDF criado."); // Log 2: Cabeçalho OK

        const tableColumn = ["Data", "Tipo", "Descrição", "Valor"];
        const tableRows: string[][] = [];

        if (!user.historico || user.historico.length === 0) {
            console.warn(`Usuário ${user.id} não possui histórico para exportar.`);
            doc.text("Nenhuma transação registrada.", 14, 60);
        } else {
            const historicoOrdenado = [...user.historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            
            console.log(`Processando ${historicoOrdenado.length} registros do histórico...`); // Log 3: Processando

            historicoOrdenado.forEach((record, index) => {
                // Verificações de segurança para cada campo
                const data = record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'Data Inválida';
                const tipo = record.tipo || 'N/A';
                const valor = typeof record.valor === 'number' 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.valor) 
                    : 'R$ 0,00';
                
                let descricao = record.nome || record.destino || '[Sem Descrição]';
                if (record.comentario) {
                    // Remove quebras de linha e caracteres problemáticos do comentário
                    const comentarioLimpo = record.comentario.replace(/(\r\n|\n|\r)/gm, " ");
                    descricao += ` (${comentarioLimpo})`;
                }

                // Garante que todos os valores são strings
                tableRows.push([String(data), String(tipo), String(descricao), String(valor)]);
            });

            console.log("Dados da tabela processados. Gerando tabela..."); // Log 4: Tabela
        }

          autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
            });
            
            console.log("Tabela gerada. Iniciando download...");

            doc.save(`${user.id}_extrato.pdf`);

        } catch (error) {
            console.error("Erro CRÍTICO durante a exportação do PDF:", error);
            alert(`Ocorreu um erro ao gerar o PDF para ${user.id}. Verifique o console.`);
        } finally {
            console.log(`Exportação finalizada para: ${user.id}`);
            setExportingId(null);
        }
    };
  if (!isAuthenticated || loading) {
    return <div className="p-8 text-center">Carregando dados de usuários...</div>;
  }

   return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Painel do Administrador</h1>
        <p className="text-gray-500 mt-1">Gerencie e visualize os dados de todos os usuários.</p>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Filtro de Visualização</h2>
        <div>
            <h3 className="font-medium text-gray-600 mb-2">Selecionar Usuários ({selectedUserIds.length}/{allUsersData.length}):</h3>
            <div className="max-h-40 overflow-y-auto border rounded-md p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {allUsersData.map(user => (
                    <label key={user.id} className="flex items-center gap-2 text-sm p-1.5 hover:bg-gray-100 rounded cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-marista-blue focus:ring-marista-blue"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleToggleUser(user.id)}
                        />
                        <span className="truncate font-medium">{user.id}</span>
                    </label>
                ))}
            </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Resumo das Carteiras</h2>
        {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                    <UserSummaryCard 
                        key={user.id} 
                        user={user} 
                        onExport={handleExportSinglePDF}
                        isExporting={exportingId === user.id}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 py-10 border-2 border-dashed rounded-lg">
                <p className="font-medium">Nenhum usuário selecionado para exibir.</p>
                <p className="text-sm mt-2">Marque um ou mais usuários no filtro acima.</p>
            </div>
        )}
      </div>
    </div>
  );
}