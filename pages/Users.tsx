import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User, UserRole } from '../types';
import { useUsersStore } from '../store/UsersStore';
import { useInventoryStore } from '../store/InventoryStore';
import { useAuthStore } from '../store/AuthStore';
import { canUpdate, canDelete } from '../utils/permissions';
import { DEPARTMENTS } from './users/constants';
import { getFriendlyErrorMessage } from '../services/httpClient';
import UserDeleteModal from './users/components/UserDeleteModal';
import UsersTable from './users/components/UsersTable';
import UserDrawer from './users/components/UserDrawer';
import AssignItemsModal from './users/components/AssignItemsModal';

type EditUserFormData = Partial<User> & {
  password?: string;
  confirmPassword?: string;
};

const Users: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { users, isLoading, error, createUser, updateUser, deleteUser } = useUsersStore();
  const { items, assignItem } = useInventoryStore();
  const { user: currentUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editFormData, setEditFormData] = useState<EditUserFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    const state = location.state as { targetUserId?: string; editMode?: boolean } | null;
    if (state?.targetUserId) {
      const targetUser = users.find((u) => u.id === state.targetUserId);
      if (targetUser) {
        setSelectedUser(targetUser);
        if (state.editMode) {
          setEditFormData(targetUser);
          setIsEditing(true);
        } else {
          setIsEditing(false);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, users]);

  useEffect(() => {
    if (selectedUser && !isCreating && !isEditing) {
      setEditFormData({});
      setErrors({});
    }
  }, [selectedUser?.id]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.includes(searchQuery)
  );

  const handleUserClick = (user: User) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setIsCreating(false);
      setIsEditing(false);
      return;
    }
    setSelectedUser(user);
    setIsCreating(false);
    setIsEditing(false);
    setErrors({});
  };

  const handleEditClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
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
    void deleteUser(userToDelete.id);

    if (selectedUser?.id === userToDelete.id) {
      setSelectedUser(null);
      setIsEditing(false);
      setIsCreating(false);
    }

    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleNewUser = () => {
      navigate('/users/add');
  };

  const handleStartEditing = () => {
    if (!selectedUser) return;
    setEditFormData(selectedUser);
    setIsEditing(true);
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
      setEditFormData((prev) => ({ ...prev, [name]: value }) as EditUserFormData);

      if (errors[name]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
      }
  };

  const handleAvatarChange = (avatar: string) => {
    setEditFormData((prev) => ({ ...prev, avatar }) as EditUserFormData);
    if (errors.avatar) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
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

      const password = (editFormData.password ?? '').trim();
      const confirmPassword = (editFormData.confirmPassword ?? '').trim();
      const isTryingToChangePassword = Boolean(password.length > 0 || confirmPassword.length > 0);

      if (isCreating) {
        if (!password) {
          newErrors.password = 'Senha é obrigatória';
        } else if (password.length < 6) {
          newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }
        if (!confirmPassword) {
          newErrors.confirmPassword = 'Confirme a senha';
        } else if (confirmPassword !== password) {
          newErrors.confirmPassword = 'As senhas não conferem';
        }
      } else if (isTryingToChangePassword) {
        if (!password) {
          newErrors.password = 'Nova senha é obrigatória';
        } else if (password.length < 6) {
          newErrors.password = 'Nova senha deve ter pelo menos 6 caracteres';
        }
        if (!confirmPassword) {
          newErrors.confirmPassword = 'Confirme a nova senha';
        } else if (confirmPassword !== password) {
          newErrors.confirmPassword = 'As senhas não conferem';
        }
      }

      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          return;
      }

      if (isCreating) {
          void (async () => {
            try {
              const role: UserRole = (editFormData.role as UserRole | undefined) ?? 'Usuario';
              const created = await createUser({
                name: editFormData.name || '',
                email: editFormData.email || '',
                phone: editFormData.phone,
                cpf: editFormData.cpf,
                jobTitle: editFormData.jobTitle,
                password,
                role,
                department: (editFormData.department || 'TI') as string,
                avatar: editFormData.avatar || 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
                status: (editFormData.status || 'active') as 'active' | 'inactive',
                itemsCount: (editFormData.itemsCount ?? 0) as number,
              });
              setSelectedUser(created);
              setIsCreating(false);
              setIsEditing(false);
              setEditFormData({});
            } catch (e) {
              alert(getFriendlyErrorMessage(e, 'general'));
            }
          })();
          return;
      } else {
          void (async () => {
            try {
              const payload: any = { id: selectedUser.id };
              if (typeof editFormData.name === 'string') payload.name = editFormData.name;
              if (typeof editFormData.email === 'string') payload.email = editFormData.email;
              if (typeof editFormData.phone === 'string') payload.phone = editFormData.phone;
              if (editFormData.cpf !== undefined) payload.cpf = editFormData.cpf;
              if (editFormData.jobTitle !== undefined) payload.jobTitle = editFormData.jobTitle;
              if (typeof editFormData.department === 'string') payload.department = editFormData.department;
              if (typeof editFormData.avatar === 'string') payload.avatar = editFormData.avatar;
              if (editFormData.status === 'active' || editFormData.status === 'inactive') payload.status = editFormData.status;
              if (editFormData.role === 'Administrador' || editFormData.role === 'Gerente' || editFormData.role === 'Usuario') {
                payload.role = editFormData.role;
              }
              if (isTryingToChangePassword) payload.password = password;

              const updated = await updateUser(payload);
              setSelectedUser(updated);
              setIsEditing(false);
              setEditFormData({});
            } catch (e) {
              alert(getFriendlyErrorMessage(e, 'general'));
            }
          })();
          return;
      }
  };

  const handleToggleStatus = () => {
      if (!selectedUser) return;
      
      const newStatus: 'active' | 'inactive' = selectedUser.status === 'active' ? 'inactive' : 'active';
      void (async () => {
        const updated = await updateUser({ id: selectedUser.id, status: newStatus });
        setSelectedUser(updated);
      })();
  };

  const allowUpdate = canUpdate(currentUser);
  const allowDelete = canDelete(currentUser);
  const assignedItems = selectedUser
    ? items.filter((i) => i.assignedTo === selectedUser.id)
    : [];

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
      {error && (
        <div className="mx-4 mt-4 md:mx-8 md:mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar usuários: {error}
        </div>
      )}

      {showDeleteModal && (
        <UserDeleteModal
          userName={userToDelete?.name}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
        />
      )}

      {showAssignModal && selectedUser && (
        <AssignItemsModal
          user={selectedUser}
          items={items}
          onClose={() => setShowAssignModal(false)}
          onConfirm={(itemIds) => {
            void (async () => {
              for (const id of itemIds) {
                await assignItem(id, selectedUser.id);
              }
              setShowAssignModal(false);
            })();
          }}
        />
      )}

      <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
        <UsersTable
          departments={DEPARTMENTS}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          isLoading={isLoading}
          users={filteredUsers}
          selectedUserId={selectedUser?.id}
          canUpdate={allowUpdate}
          canDelete={allowDelete}
          onNewUser={handleNewUser}
          onUserClick={handleUserClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />

        <UserDrawer
          departments={DEPARTMENTS}
          selectedUser={selectedUser}
          currentUser={currentUser}
          isEditing={isEditing}
          isCreating={isCreating}
          editFormData={editFormData}
          errors={errors}
          assignedItems={assignedItems}
          onAddItems={() => setShowAssignModal(true)}
          onClose={() => setSelectedUser(null)}
          onStartEditing={handleStartEditing}
          onCancelEdit={handleCancelEdit}
          onSaveProfile={handleSaveProfile}
          onToggleStatus={handleToggleStatus}
          onInputChange={handleInputChange}
          onAvatarChange={handleAvatarChange}
        />
      </div>
    </div>
  );
};

export default Users;
