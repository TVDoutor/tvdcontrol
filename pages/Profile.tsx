import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { User } from '../types';
import { useAuthStore } from '../store/AuthStore';
import { DEPARTMENTS } from './users/constants';
import UserDrawer from './users/components/UserDrawer';

const Profile: React.FC = () => {
  const location = useLocation();
  const { user: currentUser, updateProfile, changePassword, error: authError, isLoading } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const state = useMemo(() => location.state as { editMode?: boolean } | null, [location.state]);

  useEffect(() => {
    if (!currentUser) {
      setSelectedUser(null);
      setIsEditing(false);
      setEditFormData({});
      setErrors({});
      return;
    }
    setSelectedUser(currentUser);
    setEditFormData((prev) => ({ ...currentUser, ...prev }));
  }, [currentUser?.id]);

  useEffect(() => {
    if (state?.editMode) {
      setIsEditing(true);
      window.history.replaceState({}, document.title);
    }
  }, [state?.editMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }) as Partial<User>);
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAvatarChange = (avatar: string) => {
    setEditFormData((prev) => ({ ...prev, avatar }) as Partial<User>);
    if (errors.avatar) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
    }
  };

  const handleStartEditing = () => {
    if (!selectedUser) return;
    setEditFormData(selectedUser);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (!selectedUser) return;
    setIsEditing(false);
    setEditFormData(selectedUser);
    setErrors({});
  };

  const handleSaveProfile = () => {
    if (!selectedUser) return;

    const nextErrors: Record<string, string> = {};
    if (!editFormData.name?.trim()) {
      nextErrors.name = 'Nome é obrigatório';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    void (async () => {
      await updateProfile({
        name: editFormData.name?.trim(),
        department: typeof editFormData.department === 'string' ? editFormData.department : undefined,
        avatar: typeof editFormData.avatar === 'string' ? editFormData.avatar : undefined,
      });
      setIsEditing(false);
    })();
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);

    const nextErrors: Record<string, string> = {};
    if (!currentPassword) nextErrors.currentPassword = 'Senha atual é obrigatória';
    if (!newPassword) nextErrors.newPassword = 'Nova senha é obrigatória';
    else if (newPassword.length < 6) nextErrors.newPassword = 'Nova senha deve ter pelo menos 6 caracteres';
    if (!confirmNewPassword) nextErrors.confirmNewPassword = 'Confirme a nova senha';
    else if (confirmNewPassword !== newPassword) nextErrors.confirmNewPassword = 'As senhas não conferem';

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    void (async () => {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors({});
      setPasswordSuccess('Senha atualizada com sucesso');
    })();
  };

  const passwordSection = (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[18px] text-text-sub-light dark:text-text-sub-dark">lock</span>
        <h3 className="text-sm font-bold text-text-main-light dark:text-text-main-dark">Trocar senha</h3>
      </div>

      <form className="space-y-3" onSubmit={handleChangePasswordSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-sub-light font-semibold">Senha atual</label>
          <input
            type="password"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (passwordErrors.currentPassword) {
                setPasswordErrors((prev) => {
                  const next = { ...prev };
                  delete next.currentPassword;
                  return next;
                });
              }
            }}
            autoComplete="current-password"
            className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
              passwordErrors.currentPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
            }`}
          />
          {passwordErrors.currentPassword && (
            <span className="text-xs text-red-500">{passwordErrors.currentPassword}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-sub-light font-semibold">Nova senha</label>
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordErrors.newPassword) {
                setPasswordErrors((prev) => {
                  const next = { ...prev };
                  delete next.newPassword;
                  return next;
                });
              }
            }}
            autoComplete="new-password"
            className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
              passwordErrors.newPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
            }`}
          />
          {passwordErrors.newPassword && <span className="text-xs text-red-500">{passwordErrors.newPassword}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-sub-light font-semibold">Confirmar nova senha</label>
          <input
            type="password"
            name="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              if (passwordErrors.confirmNewPassword) {
                setPasswordErrors((prev) => {
                  const next = { ...prev };
                  delete next.confirmNewPassword;
                  return next;
                });
              }
            }}
            autoComplete="new-password"
            className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
              passwordErrors.confirmNewPassword
                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
            }`}
          />
          {passwordErrors.confirmNewPassword && (
            <span className="text-xs text-red-500">{passwordErrors.confirmNewPassword}</span>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          Atualizar senha
        </button>

        {passwordSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {passwordSuccess}
          </div>
        )}
      </form>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
      {authError && (
        <div className="mx-4 mt-4 md:mx-8 md:mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar perfil: {authError}
        </div>
      )}

      <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
        <div className="hidden md:block flex-1 min-w-0" />
        <UserDrawer
          departments={DEPARTMENTS}
          selectedUser={selectedUser}
          currentUser={currentUser}
          isEditing={isEditing}
          isCreating={false}
          editFormData={editFormData}
          errors={errors}
          extraContent={passwordSection}
          onClose={() => setIsEditing(false)}
          onStartEditing={handleStartEditing}
          onCancelEdit={handleCancelEdit}
          onSaveProfile={handleSaveProfile}
          onToggleStatus={() => {}}
          onInputChange={handleInputChange}
          onAvatarChange={handleAvatarChange}
        />
        <div className="hidden md:block flex-1 min-w-0" />
      </div>

      {isLoading && (
        <div className="absolute inset-0 pointer-events-none flex items-start justify-center pt-6 text-text-sub-light dark:text-text-sub-dark text-sm">
          Processando...
        </div>
      )}
    </div>
  );
};

export default Profile;

