import React from 'react';
import type { User, UserRole } from '../../../types';
import { canManageUsers } from '../../../utils/permissions';
import { USER_ROLES } from '../constants';
import { Dropdown } from '../../../components/Dropdown';
import { ContactItem, InventoryItemCard } from './UserDrawerParts';

type FieldErrors = Record<string, string>;

interface UserDrawerProps {
  departments: string[];
  selectedUser: User | null;
  currentUser: User | null | undefined;
  isEditing: boolean;
  isCreating: boolean;
  editFormData: Partial<User>;
  errors: FieldErrors;
  extraContent?: React.ReactNode;
  onClose: () => void;
  onStartEditing: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onToggleStatus: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAvatarChange: (avatar: string) => void;
}

const UserDrawer: React.FC<UserDrawerProps> = ({
  departments,
  selectedUser,
  currentUser,
  isEditing,
  isCreating,
  editFormData,
  errors,
  extraContent,
  onClose,
  onStartEditing,
  onCancelEdit,
  onSaveProfile,
  onToggleStatus,
  onInputChange,
  onAvatarChange,
}) => {
  const avatarInputId = React.useId();
  const emitChange = (name: string, value: string) => {
    onInputChange({ target: { name, value } } as any);
  };
  const avatarUrl = selectedUser
    ? ((isEditing ? editFormData.avatar : selectedUser.avatar) ?? selectedUser.avatar ?? '')
    : '';

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        onAvatarChange(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside
      className={`
        fixed inset-0 z-50 lg:static lg:z-auto bg-white dark:bg-surface-dark 
        flex flex-col border-l border-border-light dark:border-border-dark shadow-2xl lg:shadow-none
        h-full shrink-0 transition-[width,transform,opacity] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] overflow-hidden
        ${selectedUser ? 'translate-x-0 w-full lg:w-[380px] opacity-100' : 'translate-x-full lg:translate-x-0 w-full lg:w-0 opacity-0 lg:opacity-100 lg:border-none'}
      `}
    >
      <div className="w-full lg:w-[380px] h-full flex flex-col">
        {selectedUser && (
          <>
            <div className="p-6 border-b border-border-light dark:border-border-dark relative">
              <button
                onClick={onClose}
                className="absolute top-4 left-4 lg:hidden text-text-sub-light hover:text-text-main-light p-2 rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>

              <button
                onClick={onClose}
                className="hidden lg:block absolute top-4 right-4 text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex flex-col items-center text-center mt-6 lg:mt-0">
                <div
                  className="size-24 lg:size-20 rounded-full bg-cover bg-center border-4 border-white dark:border-surface-dark shadow-sm mb-3"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                ></div>

                {isEditing ? (
                  <div className="flex flex-col gap-2 w-full mt-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-center gap-2">
                      <input
                        id={avatarInputId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <label
                        htmlFor={avatarInputId}
                        className="cursor-pointer text-xs font-bold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
                      >
                        Trocar foto
                      </label>
                      <button
                        type="button"
                        onClick={() => onAvatarChange('')}
                        className="text-xs font-bold px-3 py-2 rounded-lg border border-border-light dark:border-border-dark text-text-sub-light hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        name="name"
                        value={editFormData.name || ''}
                        onChange={onInputChange}
                        className={`w-full text-center font-bold text-lg bg-slate-50 dark:bg-slate-800 border rounded px-2 py-1 text-slate-900 dark:text-white outline-none ${
                          errors.name
                            ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-slate-300 dark:border-slate-700 focus:ring-primary focus:border-primary'
                        }`}
                        placeholder="Nome Completo"
                        autoFocus
                      />
                      {errors.name && <span className="text-xs text-red-500 block mt-1">{errors.name}</span>}
                    </div>
                    {canManageUsers(currentUser) ? (
                      <Dropdown
                        name="role"
                        value={(editFormData.role as UserRole | undefined) ?? 'Usuario'}
                        options={USER_ROLES.map((role) => ({ value: role, label: role, icon: 'badge' }))}
                        buttonClassName="w-full text-center text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary outline-none flex items-center justify-between"
                        onValueChange={(v) => emitChange('role', v)}
                        renderValue={(_value, option) => (
                          <span className="flex-1 text-center text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                            {option?.label ?? _value}
                          </span>
                        )}
                      />
                    ) : (
                      <input
                        name="role"
                        value={(editFormData.role as UserRole | undefined) ?? selectedUser.role}
                        onChange={onInputChange}
                        className="text-center text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary outline-none"
                        placeholder="Cargo"
                        disabled
                      />
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-text-sub-light font-semibold">URL do avatar</label>
                      <input
                        name="avatar"
                        value={editFormData.avatar || ''}
                        onChange={onInputChange}
                        className="w-full text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">{selectedUser.name}</h2>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-sm">
                      {selectedUser.role} • ID: #
                      {selectedUser.id === 'admin'
                        ? 'ADMIN'
                        : selectedUser.id.length > 5
                          ? 'NEW'
                          : selectedUser.id.padStart(4, '0')}
                    </p>
                  </>
                )}

                <div className="flex gap-3 mt-6 w-full justify-center">
                  {isEditing ? (
                    <>
                      <button
                        onClick={onCancelEdit}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={onSaveProfile}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        Salvar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onStartEditing}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Editar Perfil
                      </button>
                      <button className="flex items-center justify-center p-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light transition-colors text-text-sub-light">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50 dark:bg-black/20">
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
                          onChange={onInputChange}
                          disabled={!canManageUsers(currentUser)}
                          className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
                            errors.email
                              ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                              : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
                          }`}
                          placeholder="exemplo@empresa.com"
                        />
                        {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-sub-light font-semibold">Departamento</label>
                        <Dropdown
                          name="department"
                          value={editFormData.department || 'TI'}
                          options={departments.map((dept) => ({ value: dept, label: dept, icon: 'domain' }))}
                          buttonClassName="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none flex items-center justify-between"
                          onValueChange={(v) => emitChange('department', v)}
                        />
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

              {!isEditing && !isCreating && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                      Itens Atribuídos ({selectedUser.itemsCount})
                    </h3>
                    <button className="text-primary text-xs font-bold hover:underline bg-primary/10 px-2 py-1 rounded">
                      + Adicionar
                    </button>
                  </div>
                  {selectedUser.itemsCount > 0 ? (
                    <div className="space-y-3">
                      <InventoryItemCard icon="laptop_mac" name='MacBook Pro 16"' serial="C02XD12345" date="12 Jan, 2024" />
                      <InventoryItemCard icon="smartphone" name="iPhone 14" serial="G6T789012" date="15 Fev, 2024" />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-white dark:bg-surface-dark text-center border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-slate-300 text-[32px]">assignment_add</span>
                      <p className="text-sm text-slate-500">Nenhum item atribuído.</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark mb-3 tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  Notas Internas
                </h3>
                <textarea
                  className="w-full text-sm p-3 rounded-xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark focus:border-primary focus:ring-1 focus:ring-primary resize-none h-24 placeholder:text-text-sub-light/60 text-slate-900 dark:text-white outline-none"
                  placeholder="Adicione observações sobre este usuário..."
                ></textarea>
              </div>

              {extraContent ? <div>{extraContent}</div> : null}
            </div>

            {!isCreating && canManageUsers(currentUser) && (
              <div className="p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-center">
                <button
                  onClick={onToggleStatus}
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
  );
};

export default UserDrawer;
