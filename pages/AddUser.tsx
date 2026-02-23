import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsersStore } from '../store/UsersStore';
import { useInventoryStore } from '../store/InventoryStore';
import { getFriendlyErrorMessage } from '../services/httpClient';
import { DEPARTMENTS, USER_ROLES, ROLE_LABELS } from './users/constants';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';

type FormState = {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  password: string;
  confirmPassword: string;
  assignedItemIds: string[];
};

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const { createUser } = useUsersStore();
  const { items, assignItem } = useInventoryStore();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    department: 'TI',
    role: 'Usuario',
    password: '',
    confirmPassword: '',
    assignedItemIds: [],
  });

  const availableItems = useMemo(
    () => items.filter((i) => !i.assignedTo),
    [items]
  );

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const setField = (name: keyof FormState, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [name]: value } as FormState));
    if (errors[name as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as string];
        return next;
      });
    }
  };

  const toggleAssignedItem = (id: string) => {
    setForm((prev) => {
      const has = prev.assignedItemIds.includes(id);
      const nextIds = has
        ? prev.assignedItemIds.filter((x) => x !== id)
        : [...prev.assignedItemIds, id];
      return { ...prev, assignedItemIds: nextIds };
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const requiresPassword = form.role === 'Administrador' || form.role === 'Gerente';
    if (!form.name.trim()) nextErrors.name = 'Nome é obrigatório';
    if (form.name.trim().length < 3) nextErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    if (!form.email.trim()) nextErrors.email = 'Email é obrigatório';
    if (form.email.trim() && !validateEmail(form.email)) nextErrors.email = 'Email inválido';
    if (!form.phone.trim()) nextErrors.phone = 'Telefone é obrigatório';
    if (requiresPassword) {
      if (!form.password) nextErrors.password = 'Senha é obrigatória';
      if (form.password.length < 6) nextErrors.password = 'Senha deve ter pelo menos 6 caracteres';
      if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirme a senha';
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = 'As senhas não conferem';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    void (async () => {
      try {
        const requiresPassword = form.role === 'Administrador' || form.role === 'Gerente';
        const created = await createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: requiresPassword ? form.password : undefined,
          role: form.role as any,
          department: form.department,
          avatar: DEFAULT_AVATAR,
          status: 'active',
          itemsCount: 0,
        });

        for (const id of form.assignedItemIds) {
          await assignItem(id, created.id);
        }

        navigate('/users', { state: { targetUserId: created.id } });
      } catch (e) {
        alert(getFriendlyErrorMessage(e, 'general'));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleCancel = () => {
    navigate('/users');
  };

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
      <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
        <div className="flex-1 min-w-0 max-w-[960px] mx-auto w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
                Cadastro de Usuário
              </h1>
              <p className="text-text-sub-light dark:text-text-sub-dark mt-1">
                Preencha os dados para criar um novo usuário e atribuir equipamentos.
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark text-text-sub-light hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Voltar
            </button>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Dados do Usuário</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Nome *</span>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark ${
                    errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  placeholder="Nome completo"
                />
                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Email *</span>
                <input
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark ${
                    errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  placeholder="email@empresa.com"
                  type="email"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Telefone *</span>
                <input
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark ${
                    errors.phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  placeholder="(11) 99999-9999"
                />
                {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Departamento</span>
                <select
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Perfil</span>
                <select
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role} — {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-text-sub-light dark:text-text-sub-dark">
                  Produto/Inventário: usa o sistema. Sistema: inclui, exclui e ajusta dados.
                </span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">
                  Senha {(form.role === 'Administrador' || form.role === 'Gerente') ? '*' : '(opcional)'}
                </span>
                <input
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark ${
                    errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-main-light dark:text-slate-200">
                  Confirmar Senha {(form.role === 'Administrador' || form.role === 'Gerente') ? '*' : '(opcional)'}
                </span>
                <input
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                  type="password"
                  placeholder="Confirme a senha"
                />
                {errors.confirmPassword && (
                  <span className="text-xs text-red-500">{errors.confirmPassword}</span>
                )}
              </label>
            </div>

            <div className="p-6 border-t border-border-light dark:border-border-dark">
              <h3 className="text-base font-semibold text-text-main-light dark:text-text-main-dark mb-4">
                Atribuir Equipamentos
              </h3>
              {availableItems.length === 0 ? (
                <div className="text-sm text-text-sub-light dark:text-text-sub-dark">
                  Nenhum item disponível para atribuição.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 px-3 py-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.assignedItemIds.includes(item.id)}
                        onChange={() => toggleAssignedItem(item.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
                          {item.name || item.model}
                        </span>
                        <span className="text-xs text-text-sub-light dark:text-text-sub-dark">
                          {item.serialNumber}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-800/40">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-text-sub-light hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm disabled:opacity-70"
              >
                {isSaving ? 'Salvando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
