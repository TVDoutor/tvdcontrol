import React, { useState } from 'react';
import type { User, UserRole } from '../../../types';
import { ROLE_LABELS } from '../constants';
import { Dropdown } from '../../../components/Dropdown';

interface UsersTableProps {
  departments: string[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isLoading: boolean;
  users: User[];
  selectedUserId?: string;
  canUpdate: boolean;
  canDelete: boolean;
  onNewUser: () => void;
  onUserClick: (user: User) => void;
  onEditClick: (event: React.MouseEvent, user: User) => void;
  onDeleteClick: (event: React.MouseEvent, user: User) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  departments,
  searchQuery,
  onSearchQueryChange,
  isLoading,
  users,
  selectedUserId,
  canUpdate,
  canDelete,
  onNewUser,
  onUserClick,
  onEditClick,
  onDeleteClick,
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 h-full overflow-y-auto pr-2 transition-all duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
            Gerenciamento de Usuários
          </h1>
          <p className="text-text-sub-light dark:text-text-sub-dark mt-1">
            Usuários de <strong>Sistema</strong> incluem, excluem e ajustam dados. Usuários de <strong>Produto/Inventário</strong> apenas utilizam o inventário.
          </p>
        </div>
        <button
          onClick={onNewUser}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-primary/30 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark shadow-sm">
        <div className="md:col-span-5 relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-sub-light dark:text-text-sub-dark material-symbols-outlined group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all placeholder:text-text-sub-light/70"
            placeholder="Buscar por nome, email ou ID..."
            type="text"
          />
        </div>
        <div className="md:col-span-3">
          <Dropdown
            value={departmentFilter}
            placeholder="Todos Departamentos"
            options={[
              { value: '', label: 'Todos Departamentos', icon: 'domain' },
              ...departments.map((dept) => ({ value: dept, label: dept, icon: 'domain' })),
            ]}
            buttonClassName="w-full py-2.5 px-3 bg-background-light dark:bg-background-dark border border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-text-main-light dark:text-text-main-dark cursor-pointer text-left flex items-center justify-between"
            onValueChange={setDepartmentFilter}
          />
        </div>
        <div className="md:col-span-3">
          <Dropdown
            value={statusFilter}
            placeholder="Todos Status"
            options={[
              { value: '', label: 'Todos Status', icon: 'list' },
              { value: 'ativo', label: 'Ativo', icon: 'check_circle' },
            ]}
            buttonClassName="w-full py-2.5 px-3 bg-background-light dark:bg-background-dark border border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-text-main-light dark:text-text-main-dark cursor-pointer text-left flex items-center justify-between"
            onValueChange={setStatusFilter}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-border-light dark:border-border-dark text-xs uppercase text-text-sub-light dark:text-text-sub-dark font-semibold">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4 hidden sm:table-cell">Perfil</th>
                <th className="px-6 py-4 hidden sm:table-cell">Departamento</th>
                <th className="px-6 py-4 text-center hidden sm:table-cell">Itens</th>
                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-sub-light dark:text-text-sub-dark">
                    Carregando usuários...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => onUserClick(user)}
                    className={`group cursor-pointer transition-all duration-200 border-l-4 ${
                      selectedUserId === user.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-primary shadow-sm'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-transparent'
                    }`}
                  >
                    <td className={`px-6 py-4 ${selectedUserId === user.id ? 'pl-5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-full bg-cover bg-center border border-border-light dark:border-border-dark shrink-0"
                          style={{ backgroundImage: `url("${user.avatar}")` }}
                        ></div>
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${
                              selectedUserId === user.id
                                ? 'text-primary dark:text-blue-400'
                                : 'text-text-main-light dark:text-text-main-dark'
                            }`}
                          >
                            {user.name}
                          </span>
                          <span className="text-xs text-text-sub-light dark:text-text-sub-dark truncate max-w-[150px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Usuario'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {ROLE_LABELS[user.role as UserRole] ?? user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-sub-light dark:text-text-sub-dark hidden sm:table-cell">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.itemsCount > 0
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {user.itemsCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
                          user.status === 'active'
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400'
                            : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}
                        ></span>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUserClick(user);
                          }}
                          className="text-text-sub-light dark:text-text-sub-dark hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Ver Detalhes"
                        >
                          <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        {canUpdate && (
                          <button
                            onClick={(e) => onEditClick(e, user)}
                            className="text-text-sub-light dark:text-text-sub-dark hover:text-primary p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Editar Usuário"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={(e) => onDeleteClick(e, user)}
                            className="text-text-sub-light dark:text-text-sub-dark hover:text-red-500 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Excluir Usuário"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-sub-light dark:text-text-sub-dark">
                    Nenhum usuário encontrado para "{searchQuery}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
