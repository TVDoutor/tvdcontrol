import type { UserRole } from '../../types';

export const DEPARTMENTS: string[] = [
  'Vendas',
  'TI',
  'Sucesso do Cliente',
  'Marketing',
  'Diretoria',
  'Financeiro',
  'RH',
  'Publicidade',
  'Criação',
];

export const USER_ROLES: UserRole[] = ['Usuario', 'Gerente', 'Administrador'];

/** Rótulos para exibição das roles na UI */
export const ROLE_LABELS: Record<UserRole, string> = {
  Usuario: 'Produto / Inventário',
  Gerente: 'Sistema',
  Administrador: 'Sistema',
};

