import React, { useState } from 'react';
import type { InventoryItem, User, UserRole } from '../../../types';
import { canManageUsers } from '../../../utils/permissions';
import { USER_ROLES, ROLE_LABELS } from '../constants';
import { Dropdown } from '../../../components/Dropdown';
import { ContactItem, InventoryItemCard } from './UserDrawerParts';
import { getUsersService } from '../../../services/usersService';

type FieldErrors = Record<string, string>;

interface UserDrawerProps {
  departments: string[];
  selectedUser: User | null;
  currentUser: User | null | undefined;
  isEditing: boolean;
  isCreating: boolean;
  editFormData: (Partial<User> & { password?: string; confirmPassword?: string });
  errors: FieldErrors;
  assignedItems: InventoryItem[];
  onAddItems: () => void;
  extraContent?: React.ReactNode;
  onClose: () => void;
  onStartEditing: () => void;
  onCancelEdit: () => void;
  onSaveProfile: () => void;
  onToggleStatus: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAvatarChange: (avatar: string) => void;
}

function formatCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const UserDrawerDownloadTermoButton: React.FC<{ userId: string; userName: string }> = ({ userId, userName }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownload = () => {
    setIsDownloading(true);
    const svc = getUsersService();
    const safeName = (userName || 'usuario').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 30);
    const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    void svc
      .downloadTermoItens(userId, `termo-itens-${safeName}-${date}.pdf`)
      .catch(() => alert('Não foi possível baixar o termo. Tente novamente.'))
      .finally(() => setIsDownloading(false));
  };
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {isDownloading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Gerando PDF...
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-[20px]">download</span>
          Baixar termo com itens
        </>
      )}
    </button>
  );
};

const UserDrawer: React.FC<UserDrawerProps> = ({
  departments,
  selectedUser,
  currentUser,
  isEditing,
  isCreating,
  editFormData,
  errors,
  assignedItems,
  onAddItems,
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

  const [avatarUploadError, setAvatarUploadError] = React.useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = React.useState(false);

  const compressAvatarFile = async (file: File): Promise<string> => {
    const maxDataUrlLength = 60000;
    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      });

      const originalW = Math.max(1, img.naturalWidth || img.width || 1);
      const originalH = Math.max(1, img.naturalHeight || img.height || 1);

      const targets = [
        { maxSide: 256, quality: 0.82 },
        { maxSide: 224, quality: 0.78 },
        { maxSide: 192, quality: 0.74 },
        { maxSide: 160, quality: 0.7 },
        { maxSide: 128, quality: 0.68 },
      ];

      for (const t of targets) {
        const scale = Math.min(1, t.maxSide / Math.max(originalW, originalH));
        const w = Math.max(1, Math.round(originalW * scale));
        const h = Math.max(1, Math.round(originalH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.drawImage(img, 0, 0, w, h);

        const webp = canvas.toDataURL('image/webp', t.quality);
        if (webp.length <= maxDataUrlLength) return webp;

        const jpeg = canvas.toDataURL('image/jpeg', Math.min(0.85, t.quality + 0.08));
        if (jpeg.length <= maxDataUrlLength) return jpeg;
      }

      throw new Error('Imagem muito grande para salvar como avatar');
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setIsAvatarUploading(true);
    void (async () => {
      try {
        if (!file.type.startsWith('image/')) {
          setAvatarUploadError('Arquivo inválido. Selecione uma imagem.');
          return;
        }
        if (file.size > 8 * 1024 * 1024) {
          setAvatarUploadError('Imagem muito grande. Use até 8MB.');
          return;
        }
        const dataUrl = await compressAvatarFile(file);
        onAvatarChange(dataUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao processar imagem';
        setAvatarUploadError(msg);
      } finally {
        setIsAvatarUploading(false);
      }
    })();
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
                        className={`cursor-pointer text-xs font-bold px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors ${isAvatarUploading ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        {isAvatarUploading ? 'Processando...' : 'Trocar foto'}
                      </label>
                      <button
                        type="button"
                        onClick={() => onAvatarChange('')}
                        className="text-xs font-bold px-3 py-2 rounded-lg border border-border-light dark:border-border-dark text-text-sub-light hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Remover
                      </button>
                    </div>

                    {avatarUploadError ? (
                      <div className="text-xs text-red-600 dark:text-red-400">{avatarUploadError}</div>
                    ) : null}

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
                        options={USER_ROLES.map((role) => ({ value: role, label: `${role} — ${ROLE_LABELS[role]}`, icon: 'badge' }))}
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
                        value={
                          typeof editFormData.avatar === 'string' && editFormData.avatar.startsWith('data:')
                            ? ''
                            : editFormData.avatar || ''
                        }
                        onChange={onInputChange}
                        className="w-full text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-2 text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary outline-none"
                        placeholder="https://..."
                      />
                      {typeof editFormData.avatar === 'string' && editFormData.avatar.startsWith('data:') ? (
                        <span className="text-[11px] text-text-sub-light dark:text-text-sub-dark">
                          Avatar carregado por upload local.
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-bold text-text-main-light dark:text-text-main-dark">{selectedUser.name}</h2>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-sm">
                      {ROLE_LABELS[selectedUser.role as UserRole] ?? selectedUser.role} • ID: #
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
                        <label className="text-xs text-text-sub-light font-semibold">Telefone (opcional)</label>
                        <input
                          name="phone"
                          value={editFormData.phone || ''}
                          onChange={onInputChange}
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-sub-light font-semibold">CPF (opcional)</label>
                        <input
                          name="cpf"
                          value={editFormData.cpf || ''}
                          onChange={onInputChange}
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-sub-light font-semibold">Cargo | Função</label>
                        <input
                          name="jobTitle"
                          value={editFormData.jobTitle || ''}
                          onChange={onInputChange}
                          className="w-full text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="Ex.: Desenvolvedor, Customer Success"
                        />
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
                      {canManageUsers(currentUser) ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-text-sub-light font-semibold">Nova senha</label>
                            <input
                              type="password"
                              name="password"
                              value={editFormData.password || ''}
                              onChange={onInputChange}
                              autoComplete="new-password"
                              className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
                                errors.password
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
                              }`}
                              placeholder={isCreating ? 'Defina uma senha' : 'Deixe vazio para não alterar'}
                            />
                            {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-text-sub-light font-semibold">Confirmar senha</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={editFormData.confirmPassword || ''}
                              onChange={onInputChange}
                              autoComplete="new-password"
                              className={`w-full text-sm bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 text-slate-900 dark:text-white outline-none ${
                                errors.confirmPassword
                                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
                              }`}
                              placeholder={isCreating ? 'Confirme a senha' : 'Confirme para alterar'}
                            />
                            {errors.confirmPassword && (
                              <span className="text-xs text-red-500">{errors.confirmPassword}</span>
                            )}
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-1">
                      <ContactItem icon="mail" label="Email" value={selectedUser.email} />
                      <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                      <ContactItem icon="call" label="Telefone" value={selectedUser.phone || '-'} />
                      <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                      <ContactItem icon="badge" label="CPF" value={selectedUser.cpf ? formatCpf(selectedUser.cpf) : '-'} />
                      <div className="border-t border-border-light dark:border-border-dark my-1"></div>
                      <ContactItem icon="work" label="Cargo | Função" value={selectedUser.jobTitle || '-'} />
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
                      Itens Atribuídos ({assignedItems.length})
                    </h3>
                    <button
                      onClick={onAddItems}
                      className="text-primary text-xs font-bold hover:underline bg-primary/10 px-2 py-1 rounded"
                    >
                      + Adicionar
                    </button>
                  </div>
                  {assignedItems.length > 0 ? (
                    <div className="space-y-3">
                      {assignedItems.map((item) => (
                        <InventoryItemCard
                          key={item.id}
                          icon={item.icon || 'inventory_2'}
                          name={item.name || item.model}
                          serial={item.serialNumber}
                          date={item.purchaseDate || '-'}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-white dark:bg-surface-dark text-center border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-slate-300 text-[32px]">assignment_add</span>
                      <p className="text-sm text-slate-500">Nenhum item atribuído.</p>
                    </div>
                  )}
                </div>
              )}

              {!isEditing && !isCreating && selectedUser && (
                <div>
                  <h3 className="text-xs uppercase font-bold text-text-sub-light dark:text-text-sub-dark mb-3 tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">article</span>
                    Termo de Responsabilidade
                  </h3>
                  <div className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <p className="text-sm text-text-sub-light dark:text-text-sub-dark mb-3">
                      Baixe o termo com a relação dos equipamentos associados a este usuário.
                    </p>
                    <UserDrawerDownloadTermoButton userId={selectedUser.id} userName={selectedUser.name} />
                  </div>
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
