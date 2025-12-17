import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

const DEPARTMENTS = [
    "Vendas",
    "TI",
    "Sucesso do Cliente",
    "Marketing",
    "Diretoria",
    "Financeiro",
    "RH",
    "Publicidade",
    "Criação"
];

const initialMockUsers: User[] = [
    { id: 'admin', name: 'Ana Silva', email: 'admin@tvdcontrol.com', role: 'Administrador', department: 'Diretoria', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVaALDdkXZEakGv-aNod9NCb-2GkYppHOzw9oubYd8sdoJNsvv4JM0DHkgBRqOy64FolHrmbTZGX9lEZqT8T9dkS_4I2XnqNYUoVS1PWJeUwM0Uoy7bpZiRa55Uyg4e3mLYg2X3YfCRkBakOiaMCCqjkBhEQFAyNjUYt-pY5j0YnI7GHnVnW9qf4C9tPi6ESIYQoaMufD37bvDhpdeDd11IZQup2XqG9mR2vhdVtNXhJ5CZLtYdlSeYVar1DPILY-ifbocYRtCa5A', itemsCount: 12, status: 'active' },
    { id: '1', name: 'Carlos Mendes', email: 'carlos.m@empresa.com', role: 'Engenharia', department: 'TI', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAi_ovget7gPlpDSqBP8Jn0k5FeGKjusgh0xFdi9ga1cloftOo_IVAYngAWT3bab5GRyxz1xcKdO9vP9WNB02H8XeDrAA_Sme1hCML9UPRLezgIku6dy5ZO-20DwKrntcnSXAI0K5J4TjYekIgEHzsYH-DJOm0Q9qWAFKOILHjbvBwlsHtakHJBHx1FaUhTi9B_l0kt91jgM4I89LReoJI_wQxZEgg8ZXlnKTjkexSbHgpfY4ndOpT_pxQZcl3MHWckxnLL8uKXlM0', itemsCount: 3, status: 'active' },
    { id: '2', name: 'Mariana Jones', email: 'mariana.j@empresa.com', role: 'UX Designer', department: 'Criação', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbGIA-lE6JAC8kMS-geX8694U8CNcMS7Mrt_W-4b2JKO3DGoSJVpFguTeXRLi9tgkoFrd9F4RUQwDhlLCW-eD4gaBcrQyJrCFPUDnR2vqSRvQ9yiz1oeMcMHCmj3hv4MBSK05UcNtZcoinRcqPxZAG3-q4FOnPWqwgoEfngpwZfTJO4uTknX1Wtj23h6Gz8ElpQ8stkCJh-0SA8NKQ8E1z6pGFbNUE7ELxEC47U1fuJk80yEtMjvyJPkisb4sysnn33Z8hmiyhzZw', itemsCount: 2, status: 'active' },
    { id: '3', name: 'Roberto Silva', email: 'roberto.silva@empresa.com', role: 'Vendas', department: 'Vendas', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8P1DqqdhdtH-4gBWtsPEMTqC4pjjWOV4lD9VemS3RMgqKIoT0ABhzRsnrm3kSD3R747iBrG-lTwiWRx1a0krQ_9QLbL01x8hHRkcNl6YYktSol942Gm0RzmI0lZnj4dlN8vf9S9QwWdwUmUxktiuH6oWbpUx-999OL1TFdcGUmkwlS9OZjHjOUlAF-cdHB2HfM6eZpS7Dn4ZoX3TOIxKQnBwtmTisfEMleUIZlkDsaFLlQSx3rhM4Ds8KTADuVI7w0w8nKYwmYko', itemsCount: 0, status: 'inactive' },
];

const Users: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>(initialMockUsers);
  // Inicializa como null para mostrar a tabela expandida inicialmente
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estado para o Modal de Exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Estado para a busca
  const [searchQuery, setSearchQuery] = useState('');

  // Effect to handle navigation from Sidebar for editing profile
  useEffect(() => {
    const state = location.state as { targetUserId?: string; editMode?: boolean } | null;
    
    if (state?.targetUserId) {
        const targetUser = users.find(u => u.id === state.targetUserId);
        if (targetUser) {
            setSelectedUser(targetUser);
            // If editMode is requested, set up editing state immediately
            if (state.editMode) {
                setEditFormData(targetUser);
                setIsEditing(true);
            } else {
                // Otherwise just view
                setIsEditing(false);
            }
        }
        // Clear state to avoid reopening on refresh (optional, but good practice in real apps)
        window.history.replaceState({}, document.title);
    }
  }, [location.state, users]);

  // Reset form when user changes (only if not creating)
  useEffect(() => {
    if (selectedUser && !isCreating && !isEditing) {
        setEditFormData({});
        setErrors({});
    }
  }, [selectedUser?.id]);

  // Filtragem de usuários baseada na busca
  const filteredUsers = users.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.includes(searchQuery)
  );

  const handleUserClick = (user: User) => {
      // Se clicar no mesmo usuário já aberto, fecha o painel
      if (selectedUser?.id === user.id) {
          setSelectedUser(null);
          setIsCreating(false);
          setIsEditing(false);
      } else {
          setSelectedUser(user);
          setIsCreating(false);
          setIsEditing(false);
          setErrors({});
      }
  };

  const handleEditClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation(); // Prevent row selection logic from interfering
      setSelectedUser(user);
      setEditFormData(user);
      setIsEditing(true);
      setIsCreating(false);
      setErrors({});
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setUserToDelete(user);
      setShowDeleteModal(true);
  };

  const confirmDelete = () => {
      if (!userToDelete) return;

      const updatedUsers = users.filter(u => u.id !== userToDelete.id);
      setUsers(updatedUsers);

      // Se o usuário excluído estiver selecionado no painel lateral, limpe a seleção
      if (selectedUser?.id === userToDelete.id) {
          setSelectedUser(null);
          setIsEditing(false);
          setIsCreating(false);
      }

      setShowDeleteModal(false);
      setUserToDelete(null);
  };

  const handleNewUser = () => {
      const newUserTemplate: User = {
          id: Date.now().toString(), // Simple ID generation
          name: '',
          email: '',
          role: '',
          department: 'TI',
          avatar: 'https://cdn-icons-png.flaticon.com/512/847/847969.png', // Default Placeholder
          itemsCount: 0,
          status: 'active'
      };
      
      setSelectedUser(newUserTemplate);
      setEditFormData(newUserTemplate);
      setIsCreating(true);
      setIsEditing(true);
      setErrors({});
  };

  const handleStartEditing = () => {
      if (selectedUser) {
          setEditFormData(selectedUser);
          setIsEditing(true);
      }
  };

  const handleCancelEdit = () => {
      if (isCreating) {
          setSelectedUser(null);
          setIsCreating(false);
      }
      setIsEditing(false);
      setEditFormData({});
      setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setEditFormData(prev => ({ ...prev, [name]: value }));
      
      // Limpa erro específico ao digitar
      if (errors[name]) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
          });
      }
  };

  const validateEmail = (email: string) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
  };

  const handleSaveProfile = () => {
      if (!selectedUser) return;

      const newErrors: Record<string, string> = {};

      if (!editFormData.name?.trim()) {
          newErrors.name = "Nome é obrigatório";
      }

      if (!editFormData.email?.trim()) {
          newErrors.email = "Email é obrigatório";
      } else if (!validateEmail(editFormData.email || '')) {
          newErrors.email = "Formato de email inválido";
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      if (isCreating) {
          // Add new user
          const newUser = { ...selectedUser, ...editFormData } as User;
          setUsers([newUser, ...users]);
          setSelectedUser(newUser);
          setIsCreating(false);
      } else {
          // Update existing user
          const updatedUsers = users.map(u => 
              u.id === selectedUser.id ? { ...u, ...editFormData } as User : u
          );
          setUsers(updatedUsers);
          setSelectedUser({ ...selectedUser, ...editFormData } as User);
      }
      
      setIsEditing(false);
  };

  const handleToggleStatus = () => {
      if (!selectedUser) return;
      
      const newStatus: 'active' | 'inactive' = selectedUser.status === 'active' ? 'inactive' : 'active';
      const updatedUser: User = { ...selectedUser, status: newStatus };
      
      const updatedUsers = users.map(u => 
        u.id === selectedUser.id ? updatedUser : u
      );

      setUsers(updatedUsers);
      setSelectedUser(updatedUser);
  };

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
        
        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
               <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-in zoom-in-95 duration-200">
                   <div className="p-6 text-center">
                        <div className="size-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                             <span className="material-symbols-outlined text-[28px]">delete_forever</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Usuário?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Você está prestes a excluir <strong>{userToDelete?.name}</strong>. Esta ação não pode ser desfeita e removerá todo o histórico e atribuições.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                   </div>
               </div>
           </div>
        )}

        <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
            {/* Left Panel: User List - Sempre flex, mas ajusta a largura quando o drawer empurra no desktop */}
            <div className={`flex flex-col flex-1 min-w-0 gap-6 h-full overflow-y-auto pr-2 transition-all duration-300`}>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">Gerenciamento de Usuários</h1>
                        <p className="text-text-sub-light dark:text-text-sub-dark mt-1">Visualize e gerencie acessos e ativos.</p>
                    </div>
                    <button 
                        onClick={handleNewUser}
                        className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-primary/30 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>Novo Usuário</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
                    <div className="md:col-span-5 relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined group-focus-within:text-primary transition-colors">search</span>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all placeholder:text-text-sub-light/70" 
                            placeholder="Buscar por nome, email ou ID..." 
                            type="text"
                        />
                    </div>
                    <div className="md:col-span-3">
                         <select className="w-full py-2.5 pl-3 pr-10 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-text-main-light dark:text-text-main-dark cursor-pointer">
                            <option value="">Todos Departamentos</option>
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                         </select>
                    </div>
                     <div className="md:col-span-3">
                         <select className="w-full py-2.5 pl-3 pr-10 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-text-main-light dark:text-text-main-dark cursor-pointer">
                            <option value="">Todos Status</option>
                            <option value="ativo">Ativo</option>
                         </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs uppercase text-text-sub-light dark:text-text-sub-dark font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Departamento</th>
                                    <th className="px-6 py-4 text-center hidden sm:table-cell">Itens</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark text-sm">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => handleUserClick(user)}
                                            className={`group cursor-pointer transition-all duration-200 border-l-4 ${
                                                selectedUser?.id === user.id 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-primary shadow-sm' 
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent'
                                            }`}
                                        >
                                            <td className={`px-6 py-4 ${selectedUser?.id === user.id ? 'pl-5' : ''}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-cover bg-center border border-border-light dark:border-border-dark shrink-0" style={{backgroundImage: `url("${user.avatar}")`}}></div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-medium ${selectedUser?.id === user.id ? 'text-primary dark:text-blue-400' : 'text-text-main-light dark:text-text-main-dark'}`}>{user.name}</span>
                                                        <span className="text-xs text-text-sub-light dark:text-text-sub-dark truncate max-w-[150px]">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-sub-light dark:text-text-sub-dark hidden sm:table-cell">{user.department}</td>
                                            <td className="px-6 py-4 text-center hidden sm:table-cell">
                                                <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.itemsCount > 0 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                    {user.itemsCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${user.status === 'active' ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400' : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                    <span className={`size-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/users/${user.id}`);
                                                        }}
                                                        className="text-text-sub-light dark:text-text-sub-dark hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Ver Detalhes"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleEditClick(e, user)}
                                                        className="text-text-sub-light dark:text-text-sub-dark hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Editar Usuário"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteClick(e, user)}
                                                        className="text-text-sub-light dark:text-text-sub-dark hover:text-red-500 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                        title="Excluir Usuário"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-sub-light dark:text-text-sub-dark">
                                            Nenhum usuário encontrado para "{searchQuery}".
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Right Panel: Expandable Drawer */}
            <aside 
                className={`
                    fixed inset-0 z-50 lg:static lg:z-auto bg-white dark:bg-surface-dark 
                    flex flex-col border-l border-border-light dark:border-border-dark shadow-2xl lg:shadow-none
                    h-full shrink-0 transition-[width,transform,opacity] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] overflow-hidden
                    ${selectedUser 
                        ? 'translate-x-0 w-full lg:w-[380px] opacity-100' // Estado Aberto
                        : 'translate-x-full lg:translate-x-0 w-full lg:w-0 opacity-0 lg:opacity-100 lg:border-none' // Estado Fechado
                    }
                `}
            >
                {/* Wrapper interno com largura fixa para evitar reflow do conteúdo durante a animação de largura */}
                <div className="w-full lg:w-[380px] h-full flex flex-col">
                {selectedUser && (
                    <>
                        <div className="p-6 border-b border-border-light dark:border-border-dark relative">
                            {/* Back button for mobile only */}
                            <button 
                                onClick={() => setSelectedUser(null)} 
                                className="absolute top-4 left-4 lg:hidden text-text-sub-light hover:text-text-main-light p-2 rounded-full bg-slate-100 dark:bg-slate-800"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>

                            <button onClick={() => setSelectedUser(null)} className="hidden lg:block absolute top-4 right-4 text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>

                            <div className="flex flex-col items-center text-center mt-6 lg:mt-0">
                                <div className="size-24 lg:size-20 rounded-full bg-cover bg-center border-4 border-white dark:border-surface-dark shadow-sm mb-3" style={{backgroundImage: `url("${selectedUser.avatar}")`}}></div>
                                
                                {isEditing ? (
                                    <div className="flex flex-col gap-2 w-full mt-1 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="relative">
                                            <input 
                                                name="name"
                                                value={editFormData.name || ''}
                                                onChange={handleInputChange}
                                                className={`w-full text-center font-bold text-lg bg-slate-50 dark:bg-slate-800 border rounded px-2 py-1 text-slate-900 dark:text-white outline-none ${errors.name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary'}`}
                                                placeholder="Nome Completo"
                                                autoFocus
                                            />
                                            {errors.name && <span className="text-xs text-red-500 block mt-1">{errors.name}</span>}
                                        </div>
                                        <input 
                                            name="role"
                                            value={editFormData.role || ''}
                                            onChange={handleInputChange}
                                            className="text-center text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary outline-none"
                                            placeholder="Cargo"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">{selectedUser.name}</h2>
                                        <p className="text-text-sub-light dark:text-text-sub-dark text-sm">{selectedUser.role} • ID: #{selectedUser.id === 'admin' ? 'ADMIN' : selectedUser.id.length > 5 ? 'NEW' : selectedUser.id.padStart(4, '0')}</p>
                                    </>
                                )}

                                <div className="flex gap-3 mt-6 w-full justify-center">
                                    {isEditing ? (
                                        <>
                                            <button onClick={handleCancelEdit} className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                            <button onClick={handleSaveProfile} className="flex-1 py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-sm">Salvar</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleStartEditing} className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">Editar Perfil</button>
                                            <button className="flex items-center justify-center p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light transition-colors text-text-sub-light">
                                                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-black/20">
                            {/* Info */}
                            <div>
                                <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark mb-3 tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">info</span>
                                    Informações
                                </h3>
                                <div className="space-y-3">
                                    {isEditing ? (
                                        <>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-text-sub-light font-semibold">Email</label>
                                                <input 
                                                    name="email"
                                                    value={editFormData.email || ''}
                                                    onChange={handleInputChange}
                                                    className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'}`}
                                                    placeholder="exemplo@empresa.com"
                                                />
                                                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-text-sub-light font-semibold">Departamento</label>
                                                <select 
                                                    name="department"
                                                    value={editFormData.department || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none appearance-none"
                                                >
                                                    {DEPARTMENTS.map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-1">
                                            <ContactItem icon="mail" label="Email" value={selectedUser.email} />
                                            <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                                            <ContactItem icon="call" label="Telefone" value="+55 (11) 98765-4321" />
                                            <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                                            <ContactItem icon="domain" label="Departamento" value={selectedUser.department} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Assigned Section (Hide when creating) */}
                            {!isEditing && !isCreating && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark tracking-wider flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                            Itens Atribuídos ({selectedUser.itemsCount})
                                        </h3>
                                        <button className="text-primary text-xs font-bold hover:underline bg-primary/10 px-2 py-1 rounded">+ Adicionar</button>
                                    </div>
                                    {selectedUser.itemsCount > 0 ? (
                                        <div className="space-y-3">
                                            <InventoryItemCard 
                                                icon="laptop_mac" 
                                                name='MacBook Pro 16"' 
                                                serial="C02XD12345" 
                                                date="12 Jan, 2024" 
                                            />
                                            <InventoryItemCard 
                                                icon="smartphone" 
                                                name="iPhone 14" 
                                                serial="G6T789012" 
                                                date="15 Fev, 2024" 
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-6 rounded-xl bg-white dark:bg-surface-dark text-center border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-slate-300 text-[32px]">assignment_add</span>
                                            <p className="text-sm text-slate-500">Nenhum item atribuído.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark mb-3 tracking-wider flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">description</span>
                                    Notas Internas
                                </h3>
                                <textarea className="w-full text-sm p-3 rounded-xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:border-primary focus:ring-1 focus:ring-primary resize-none h-24 placeholder:text-text-sub-light/60 text-slate-900 dark:text-white outline-none" placeholder="Adicione observações sobre este usuário..."></textarea>
                            </div>
                        </div>
                        
                        {/* Hide Deactivate Button when Creating */}
                        {!isCreating && (
                            <div className="p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-center">
                                <button 
                                    onClick={handleToggleStatus}
                                    className={`w-full text-sm font-bold px-4 py-3 rounded-lg transition-colors border ${
                                        selectedUser.status === 'active' 
                                        ? 'border-red-100 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30' 
                                        : 'border-green-100 bg-green-50 text-green-600 hover:bg-green-100 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                                    }`}
                                >
                                    {selectedUser.status === 'active' ? 'Desativar Usuário' : 'Reativar Usuário'}
                                </button>
                            </div>
                        )}
                    </>
                )}
                </div>
            </aside>
        </div>
    </div>
  );
};

const ContactItem = ({icon, label, value}: any) => (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group">
        <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-text-sub-light dark:text-text-sub-dark">{label}</span>
            <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark truncate">{value}</span>
        </div>
    </div>
);

const InventoryItemCard = ({icon, name, serial, date}: any) => (
    <div className="group flex flex-col p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-primary/50 transition-all bg-white dark:bg-surface-dark shadow-sm hover:shadow-md cursor-pointer">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm text-text-main-light dark:text-text-main-dark">{name}</span>
                    <span className="text-xs text-text-sub-light dark:text-text-sub-dark font-mono">{serial}</span>
                </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md font-bold">Em Uso</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
             <p className="text-xs text-slate-400">Desde: {date}</p>
             <button className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100">Devolver</button>
        </div>
    </div>
);

export default Users;