import { User, type UserRole, SYSTEM_ROLES } from '../types';

// Verifica se uma role é válida
export function isValidRole(role: string): role is UserRole {
  return role === 'Administrador' || role === 'Gerente' || role === 'Usuario';
}

// Usuário de sistema: pode incluir, excluir e ajustar dados (Administrador, Gerente)
export function isSystemUser(user: User | null | undefined): boolean {
  return !!user?.role && SYSTEM_ROLES.includes(user.role);
}

// Usuário de produto/inventário: usa o inventário, não gerencia sistema (Usuario)
export function isProductUser(user: User | null | undefined): boolean {
  return user?.role === 'Usuario';
}

// Verifica se o usuário é Administrador
export function isAdministrator(user: User | null | undefined): boolean {
  return user?.role === 'Administrador';
}

// Verifica permissão para criar itens (usuários de sistema)
export function canCreate(user: User | null | undefined): boolean {
  return isSystemUser(user);
}

// Verifica permissão para ler (todos autenticados)
export function canRead(user: User | null | undefined): boolean {
  return !!user;
}

// Verifica permissão para atualizar itens (usuários de sistema)
export function canUpdate(user: User | null | undefined): boolean {
  return isSystemUser(user);
}

// Verifica permissão para deletar itens (usuários de sistema)
export function canDelete(user: User | null | undefined): boolean {
  return isSystemUser(user);
}

// Verifica permissão para gerenciar usuários (apenas Administrador)
export function canManageUsers(user: User | null | undefined): boolean {
  return isAdministrator(user);
}

// Verifica permissão para listar usuários (Administrador e Gerente - para atribuição)
export function canListUsers(user: User | null | undefined): boolean {
  return isSystemUser(user);
}

// Verifica permissão para gerenciar categorias (usuários de sistema)
export function canManageCategories(user: User | null | undefined): boolean {
  return isSystemUser(user);
}


