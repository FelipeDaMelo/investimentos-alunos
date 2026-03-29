// Caminho do arquivo: src/components/Admin/AdminPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, documentId } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { calculateUserMetrics } from '../../utils/calculateUserMetrics';
import AdminPasswordModal from '../Ranking/AdminPasswordModal';
import Sidebar from '../Sidebar';
import { 
  ShieldAlert, Search, Download, Users, Landmark, 
  TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, 
  FileText, Check, Save, Trash2, Plus, ChevronDown, AlertCircle,
  Pencil, X, Eye
} from 'lucide-react';
import SaveGroupModal from './SaveGroupModal';
import { doc, updateDoc, setDoc, addDoc, deleteDoc, Timestamp, getDoc } from 'firebase/firestore';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

const ADMIN_PASSWORD = "admin";

interface AdminPageProps {
  login: string;
  fotoGrupo?: string | null;
  onLogout: () => void;
  onUploadConfirmado: (file: File, senhaDigitada: string) => Promise<void>;
  onImpersonate: (userId: string, fotoGrupo: string | null) => void;
}

export interface UserData {
  id: string;
  valorTotalAtual: number;
  totalAportado: number;
  rentabilidade: number;
  historico: any[];
  fotoGrupo: string | null;
}

interface SavedMonitoringGroup {
  id: string;
  nome: string;
  userIds: string[];
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatCompactCurrency = (value: number) => {
  if (value >= 1e12) return `R$ ${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `R$ ${(userValue: number) => (userValue / 1e6).toFixed(2)}M`; // Wait, this logic is handled better below
  return formatCurrency(value);
};

// Refined compact formatter
const tableFormat = (val: number) => {
  if (val >= 1_000_000_000_000) return `R$ ${(val / 1_000_000_000_000).toLocaleString('pt-BR')} Tri`;
  if (val >= 1_000_000_000) return `R$ ${(val / 1_000_000_000).toLocaleString('pt-BR')} Bi`;
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toLocaleString('pt-BR')} Mi`;
  return formatCurrency(val);
};

export default function AdminPage({
  login,
  fotoGrupo,
  onLogout,
  onUploadConfirmado,
  onImpersonate
}: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [allUsersData, setAllUsersData] = useState<UserData[]>([]);
  const [savedGroups, setSavedGroups] = useState<SavedMonitoringGroup[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newTotal, setNewTotal] = useState<string>('');
  const [newAportado, setNewAportado] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [showSaveGroupModal, setShowSaveGroupModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAdminData = async () => {
      setLoading(true);
      try {
        // Users
        const usersQuery = query(collection(db, "usuarios"), orderBy(documentId()));
        const usersSnapshot = await getDocs(usersQuery);
        const processedUsers = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          const metrics = calculateUserMetrics(data);
          
          return {
            id: doc.id,
            valorTotalAtual: metrics.valorTotalAtual,
            totalAportado: (data.historico || [])
              .filter((r: any) => r.tipo === 'deposito')
              .reduce((s: number, d: any) => s + (d.valor || 0), 0),
            rentabilidade: metrics.rentabilidade,
            historico: data.historico || [],
            fotoGrupo: data.fotoGrupo || null
          };
        });
        processedUsers.sort((a, b) => a.id.localeCompare(b.id));
        setAllUsersData(processedUsers);

        // Saved Monitoring Groups
        const groupsQuery = query(collection(db, "adminMonitoramentos"), orderBy("dataCriacao", "desc"));
        const groupsSnapshot = await getDocs(groupsQuery);
        const processedGroups = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SavedMonitoringGroup));
        setSavedGroups(processedGroups);

      } catch (error) {
        console.error("Erro ao carregar dados do admin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [isAuthenticated]);

  const searchFilteredUsers = useMemo(() => 
    allUsersData.filter(user => user.id.toLowerCase().includes(searchTerm.toLowerCase())),
    [allUsersData, searchTerm]
  );

  const statsData = useMemo(() => {
    const selectedUsers = allUsersData.filter(u => selectedUserIds.includes(u.id));
    const totalAUM = selectedUsers.reduce((acc, user) => acc + (user.valorTotalAtual || 0), 0);
    const mediaRent = selectedUsers.length > 0 
      ? selectedUsers.reduce((acc, user) => acc + (user.rentabilidade || 0), 0) / selectedUsers.length 
      : 0;
    
    return {
      count: selectedUsers.length,
      totalAUM,
      mediaRent
    };
  }, [allUsersData, selectedUserIds]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handlePerformUpdate = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const userRef = doc(db, "usuarios", editingUser.id);
      
      // 1. Atualizar Patrimônio Atual (Latest in patrimonioPorDia)
      const valAtual = parseFloat(newTotal.replace(/[^\d.,]/g, '').replace(',', '.'));
      let updatedPatrimonio = { ...((editingUser as any).patrimonioPorDia || {}) };
      
      const today = new Date().toISOString().split('T')[0];
      // Se não houver chaves, cria uma para hoje. Se houver, atualiza a última.
      const dates = Object.keys(updatedPatrimonio).sort();
      const targetDate = dates.length > 0 ? dates[dates.length - 1] : today;
      updatedPatrimonio[targetDate] = valAtual;

      // 2. Atualizar Capital Inicial (Historico de depósitos)
      const valAportado = parseFloat(newAportado.replace(/[^\d.,]/g, '').replace(',', '.'));
      // Removemos todos os depósitos antigos e inserimos um único com o novo valor total
      const filteredHistory = (editingUser.historico || []).filter((h: any) => h.tipo !== 'deposito');
      const newHistory = [
        {
          tipo: 'deposito',
          valor: valAportado,
          data: Timestamp.now(),
          descricao: 'Ajuste Administrativo de Saldo Inicial'
        },
        ...filteredHistory
      ];

      await updateDoc(userRef, {
        patrimonioPorDia: updatedPatrimonio,
        historico: newHistory
      });

      // Update local state to reflect changes instantly
      setAllUsersData(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { ...u, valorTotalAtual: valAtual, totalAportado: valAportado, historico: newHistory } 
          : u
      ));

      setEditingUser(null);
      alert("Valores ajustados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar valores:", error);
      alert("Ocorreu um erro ao salvar as alterações.");
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditing = (user: UserData) => {
    setEditingUser(user);
    setNewTotal(user.valorTotalAtual.toString());
    setNewAportado(user.totalAportado.toString());
  };

  const handleSelectAll = () => {
    setSelectedUserIds(selectedUserIds.length === allUsersData.length ? [] : allUsersData.map(u => u.id));
  };

  const handleSaveGroup = async () => {
    if (selectedUserIds.length === 0) {
      alert("Selecione ao menos um grupo para salvar o monitoramento.");
      return;
    }
    setShowSaveGroupModal(true);
  };

  const confirmSaveGroup = async (nome: string) => {
    try {
      const docRef = await addDoc(collection(db, "adminMonitoramentos"), {
        nome,
        userIds: selectedUserIds,
        dataCriacao: Timestamp.now()
      });
      
      const newGroup = { id: docRef.id, nome, userIds: selectedUserIds };
      setSavedGroups(prev => [newGroup, ...prev]);
      setShowSaveGroupModal(false);
      alert(`Monitoramento "${nome}" salvo com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar monitoramento:", error);
      alert(`Erro ao salvar. Verifique se você possui permissões no Firebase Rules para "adminMonitoramentos" (Missing or insufficient permissions).`);
    }
  };

  const handleDeleteSavedGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir este grupo de acompanhamento permanentemente?")) {
      try {
        await deleteDoc(doc(db, "adminMonitoramentos", groupId));
        setSavedGroups(prev => prev.filter(g => g.id !== groupId));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedUserIds.length === 0) {
      alert("Por favor, selecione ao menos um grupo na tabela abaixo para sincronizar as cotações.");
      return;
    }

    const targets = allUsersData.filter(u => selectedUserIds.includes(u.id));
      
    if (!confirm(`Sincronizar cotações em tempo real para os ${targets.length} grupos selecionados?`)) return;

    setIsBatchUpdating(true);
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const rawUsers = await Promise.all(targets.map(async (t) => {
        const snap = await getDoc(doc(db, 'usuarios', t.id));
        return { id: t.id, ativos: snap.data()?.ativos || [] };
      }));

      const { batchAtualizarAtivos } = await import('../../utils/batchAtualizarAtivos');
      const updatedUsers = await batchAtualizarAtivos(rawUsers, hoje);

      await Promise.all(updatedUsers.map(async (u) => {
        await updateDoc(doc(db, 'usuarios', u.id), {
          ativos: u.ativos,
          ultimaAtualizacao: hoje
        });
      }));

      alert(`Cotações atualizadas com sucesso para ${targets.length} grupos! Recarregando painel...`);
      window.location.reload();
    } catch (error) {
      console.error("Erro no batch update:", error);
      alert("Ocorreu um erro limitante durante a atualização em massa da B3.");
    } finally {
      setIsBatchUpdating(false);
    }
  };

    const handleExportSinglePDF = async (user: UserData) => {
        setExportingId(user.id);

    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Extrato de Transações", 14, 22);
        doc.setFontSize(14);
        doc.text(`Grupo: ${user.id}`, 14, 30);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, 14, 36);

        const tableColumn = ["Data", "Tipo", "Descrição", "Valor"];
        const tableRows: string[][] = [];

        if (!user.historico || user.historico.length === 0) {
            doc.text("Nenhuma transação registrada.", 14, 60);
        } else {
            const historicoOrdenado = [...user.historico].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
            
            historicoOrdenado.forEach((record, index) => {
                const data = record.data ? new Date(record.data).toLocaleDateString('pt-BR') : 'Data Inválida';
                const tipo = record.tipo || 'N/A';
                const valor = typeof record.valor === 'number' 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(record.valor) 
                    : 'R$ 0,00';
                
                let descricao = record.nome || record.destino || '[Sem Descrição]';
                if (record.comentario) {
                    const comentarioLimpo = record.comentario.replace(/(\r\n|\n|\r)/gm, " ");
                    descricao += ` (${comentarioLimpo})`;
                }

                tableRows.push([String(data), String(tipo), String(descricao), String(valor)]);
            });
        }

          autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
                theme: 'striped',
                headStyles: { fillColor: [22, 160, 133] },
            });
            
            doc.save(`${user.id}_extrato.pdf`);

        } catch (error) {
            console.error("Erro CRÍTICO durante a exportação do PDF:", error);
            alert(`Ocorreu um erro ao gerar o PDF para ${user.id}.`);
        } finally {
            setExportingId(null);
        }
    };

  if (!isAuthenticated) {
    return showPasswordModal ? (
       <AdminPasswordModal 
         title="Acesso Administrativo"
         onClose={() => navigate('/')}
         onConfirm={(senha) => {
           if (senha === ADMIN_PASSWORD) {
             setIsAuthenticated(true);
             setShowPasswordModal(false);
           } else {
             alert("Senha incorreta! Acesso negado.");
             navigate('/');
           }
         }}
       />
    ) : null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center animate-spin">
            <ShieldAlert size={24} />
          </div>
          <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">Descriptografando Registros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar 
        login={login}
        fotoGrupo={fotoGrupo as string | null}
        onLogout={onLogout}
        onUploadConfirmado={onUploadConfirmado}
        onTriggerDelete={() => {}} 
      />
      
      <div className="flex-1 h-screen overflow-y-auto flex flex-col relative bg-slate-50 w-full transition-all duration-300">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-6 sticky top-0 z-30 shadow-sm">
          <div className="w-full flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-slate-200 shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">Backoffice</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Terminal Administrativo</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full p-4 pb-28 sm:p-6 md:pb-10 lg:p-10 space-y-10">
          
          {/* Controls Area */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-2 border-slate-100 p-4 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group">
                <button className="flex items-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm tracking-tight transition-all hover:bg-slate-800 shadow-xl shadow-slate-200">
                  <Plus size={18} />
                  Carregar Monitoramento
                  <ChevronDown size={16} className="opacity-50" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl z-50 py-3 hidden group-hover:block animate-fade-in">
                  <p className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-2">Grupos de Acompanhamento Salvos</p>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {savedGroups.length > 0 ? (
                      savedGroups.map(group => (
                        <div key={group.id} className="group/item flex items-center justify-between px-3 py-1">
                          <button 
                            onClick={() => setSelectedUserIds(group.userIds)}
                            className="flex-1 text-left px-4 py-3 rounded-2xl hover:bg-blue-50 text-slate-700 font-bold text-sm transition-all"
                          >
                            {group.nome}
                            <span className="block text-[10px] text-slate-400 mt-0.5">{group.userIds.length} grupos selecionados</span>
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSavedGroup(group.id, e)}
                            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="px-6 py-8 text-center text-sm text-slate-400 italic">Nenhum grupo salvo ainda</p>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveGroup}
                className="flex items-center gap-2 px-6 py-4 bg-blue-50 text-blue-600 rounded-[1.5rem] font-black text-sm tracking-tight transition-all hover:bg-blue-100"
              >
                <Save size={18} />
                Salvar Seleção Atual
              </button>

              <button 
                onClick={handleBatchUpdate}
                disabled={isBatchUpdating}
                className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm tracking-tight transition-all hover:bg-slate-800 shadow-xl shadow-slate-200 disabled:opacity-70"
              >
                <RefreshCw size={18} className={isBatchUpdating ? 'animate-spin' : ''} />
                {isBatchUpdating ? 'Sincronizando...' : 'Sincronizar Cotações'}
              </button>
            </div>

            <div className="flex items-center gap-3">
               <span className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl uppercase tracking-widest">
                 {selectedUserIds.length} Selecionados
               </span>
               <button 
                 onClick={() => setSelectedUserIds([])}
                 className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
               >
                 Limpar
               </button>
            </div>
          </div>

          {/* KPI Dashboard Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-6">
               <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shrink-0">
                 <Users size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grupos em Monitoramento</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{statsData.count}</p>
               </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-6">
               <div className="w-16 h-16 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shrink-0">
                 <Landmark size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Patrimônio Monitorado</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{formatCurrency(statsData.totalAUM)}</p>
               </div>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-6">
               <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shrink-0">
                 <TrendingUp size={28} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Média Performance (Set)</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{statsData.mediaRent.toFixed(2)}%</p>
               </div>
            </div>
          </div>

          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
               <div>
                 <h2 className="text-xl font-black text-slate-800 tracking-tight">Registro Maestro</h2>
                 <p className="text-xs font-medium text-slate-400 mt-1">Selecione os grupos para acompanhamento detalhado.</p>
               </div>
               
               <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden focus-within:border-blue-500 transition-colors bg-slate-50 w-full sm:max-w-md shrink-0">
                  <div className="w-12 shrink-0 flex items-center justify-center text-slate-400 border-r-2 border-slate-100">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Localizar via nome..."
                    className="w-full bg-transparent py-3 px-4 text-sm text-slate-800 font-bold focus:outline-none placeholder:text-slate-400"
                  />
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-5 px-8 border-b-2 border-slate-100 w-12 text-center">
                      <button 
                        onClick={handleSelectAll}
                        className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center m-auto ${selectedUserIds.length === allUsersData.length ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'}`}
                      >
                        {selectedUserIds.length === allUsersData.length && <Check size={12} strokeWidth={4} />}
                      </button>
                    </th>
                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100">Grupo / Aluno</th>
                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100">Capital Inicial (?)</th>
                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100">Patrimônio Atual</th>
                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 text-center">ROI Geral</th>
                    <th className="py-5 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-slate-100 text-right w-40">Acesso / PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchFilteredUsers.length > 0 ? (
                    searchFilteredUsers.map((user) => (
                      <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors group ${selectedUserIds.includes(user.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-5 px-8 text-center">
                          <button 
                            onClick={() => handleToggleUser(user.id)}
                            className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center m-auto ${selectedUserIds.includes(user.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' : 'border-slate-200 bg-white group-hover:border-blue-400'}`}
                          >
                            {selectedUserIds.includes(user.id) && <Check size={14} strokeWidth={3} />}
                          </button>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-4">
                            <img src={user.fotoGrupo || "/logo-marista.png"} alt={user.id} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm shrink-0" />
                            <span className="font-black text-slate-800 text-lg tracking-tight hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onImpersonate(user.id, user.fotoGrupo)} title="Acessar Dashboard deste Grupo">
                              {user.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex flex-col group/val cursor-pointer" onClick={() => startEditing(user)} title="Clique para ajustar valores">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-500 text-sm tracking-tight">{tableFormat(user.totalAportado)}</span>
                              <Pencil size={12} className="text-slate-300 opacity-0 group-hover/val:opacity-100 transition-opacity" />
                            </div>
                            {user.totalAportado > 300001 && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase mt-0.5 whitespace-nowrap">
                                <AlertCircle size={10} /> Valor Suspeito
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-2 group/val cursor-pointer" onClick={() => startEditing(user)} title="Clique para ajustar valores">
                            <span 
                              title={formatCurrency(user.valorTotalAtual)}
                              className={`font-black text-lg tracking-tight ${user.valorTotalAtual > 1000000000 ? 'text-red-600' : 'text-slate-800'}`}
                            >
                              {tableFormat(user.valorTotalAtual)}
                            </span>
                            <Pencil size={12} className="text-slate-300 opacity-0 group-hover/val:opacity-100 transition-opacity" />
                          </div>
                        </td>
                        <td className="py-5 px-8 text-center">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm tracking-tight border ${user.rentabilidade > 0.4 ? 'bg-green-50 text-green-600 border-green-100' : user.rentabilidade < -0.4 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {user.rentabilidade > 0.4 && <ArrowUpRight size={16} strokeWidth={3} />}
                            {user.rentabilidade < -0.4 && <ArrowDownRight size={16} strokeWidth={3} />}
                            <span>{user.rentabilidade.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="py-5 px-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => onImpersonate(user.id, user.fotoGrupo)}
                              className="w-10 h-10 inline-flex items-center justify-center bg-slate-800 border-2 border-slate-800 text-white hover:bg-slate-700 hover:border-slate-700 hover:shadow-lg rounded-xl transition-all active:scale-90"
                              title="Acessar Dashboard deste Grupo"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => handleExportSinglePDF(user)} 
                              disabled={exportingId === user.id}
                              className="w-10 h-10 inline-flex items-center justify-center bg-white border-2 border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-100 rounded-xl transition-all disabled:opacity-50 active:scale-90"
                              title="Exportar Extrato PDF"
                            >
                              {exportingId === user.id ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                          <Users size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">
                          {searchTerm ? 'Nenhum resultado encontrado' : 'Aguardando sincronização de grupos...'}
                        </h3>
                        <p className="text-sm font-medium text-slate-400 mt-2">
                          Mude os termos da busca ou carregue um monitoramento salvo.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      
      {showSaveGroupModal && (
        <SaveGroupModal
          onClose={() => setShowSaveGroupModal(false)}
          onConfirm={confirmSaveGroup}
        />
      )}

      {/* Edit Balance Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header matches DepositarModal style */}
            <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white z-20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
                  <Pencil size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Ajustar Saldo</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {editingUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingUser(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all group"
                aria-label="Fechar"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </header>
            
            <div className="p-8 space-y-8 bg-slate-50/30">
              <div className="space-y-6 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                {/* Total Aportado Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Total Aportado (Capital Inicial)</label>
                  <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                    <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-400 shadow-sm font-black text-lg group-focus-within:text-blue-500 transition-colors">R$</div>
                    <input 
                      type="text" 
                      value={newAportado}
                      onChange={e => setNewAportado(e.target.value)}
                      className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic px-1">* Ajusta o histórico de depósitos (Cálculo de ROI).</p>
                </div>

                {/* Patrimônio Atual Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Patrimônio Atual (Saldo Final)</label>
                  <div className="flex border-2 border-slate-100 rounded-[1.5rem] overflow-hidden group focus-within:border-blue-500 transition-all bg-slate-50">
                    <div className="w-16 shrink-0 flex items-center justify-center bg-white border-r-2 border-slate-100 text-slate-400 shadow-sm font-black text-lg group-focus-within:text-blue-500 transition-colors">R$</div>
                    <input 
                      type="text" 
                      value={newTotal}
                      onChange={e => setNewTotal(e.target.value)}
                      className="flex-1 bg-transparent px-5 py-4 text-slate-700 font-black text-xl focus:bg-white transition-all outline-none"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic px-1">* Sobrescreve a última versão do patrimônio cadastrada.</p>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-5 text-slate-500 font-bold hover:bg-slate-100 rounded-[1.5rem] transition-all bg-white border-2 border-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePerformUpdate}
                  disabled={isUpdating}
                  className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-xl shadow-slate-200 active:scale-95"
                >
                  {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : <Check size={24} strokeWidth={3} />}
                  Confirmar Ajuste
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}