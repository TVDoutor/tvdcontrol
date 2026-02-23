// Tipos de roles válidas
export type UserRole = 'Administrador' | 'Gerente' | 'Usuario';

const SYSTEM_ROLES: UserRole[] = ['Administrador', 'Gerente'];

// Verifica se uma role é válida
export function isValidRole(role: string): role is UserRole {
  return role === 'Administrador' || role === 'Gerente' || role === 'Usuario';
}

// Usuário de sistema: pode incluir, excluir e ajustar dados
export function isSystemUser(role: string | null | undefined): boolean {
  return !!role && SYSTEM_ROLES.includes(role as UserRole);
}

// Verifica se o usuário é Administrador
export function isAdministrator(role: string | null | undefined): boolean {
  return role === 'Administrador';
}

// Verifica permissão para criar itens (usuários de sistema)
export function canCreate(role: string | null | undefined): boolean {
  return isSystemUser(role);
}

// Verifica permissão para ler (todos autenticados)
export function canRead(role: string | null | undefined): boolean {
  return !!role;
}

// Verifica permissão para atualizar itens (usuários de sistema)
export function canUpdate(role: string | null | undefined): boolean {
  return isSystemUser(role);
}

// Verifica permissão para deletar itens (usuários de sistema)
export function canDelete(role: string | null | undefined): boolean {
  return isSystemUser(role);
}

// Verifica permissão para gerenciar usuários (apenas Administrador)
export function canManageUsers(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

// Verifica permissão para gerenciar categorias (usuários de sistema)
export function canManageCategories(role: string | null | undefined): boolean {
  return isSystemUser(role);
}

