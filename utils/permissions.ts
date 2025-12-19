import { User, type UserRole } from '../types';

// Verifica se uma role é válida
export function isValidRole(role: string): role is UserRole {
  return role === 'Administrador' || role === 'Gerente' || role === 'Usuario';
}

// Verifica se o usuário é Administrador
export function isAdministrator(user: User | null | undefined): boolean {
  return user?.role === 'Administrador';
}

// Verifica se o usuário é Gerente ou Administrador
export function isManagerOrAdmin(user: User | null | undefined): boolean {
  return user?.role === 'Administrador' || user?.role === 'Gerente';
}

// Verifica permissão para criar (todos podem criar)
export function canCreate(user: User | null | undefined): boolean {
  return Boolean(user && isValidRole(user.role));
}

// Verifica permissão para ler (todos podem ler)
export function canRead(user: User | null | undefined): boolean {
  return Boolean(user && isValidRole(user.role));
}

// Verifica permissão para atualizar
// Administrador e Gerente podem atualizar
export function canUpdate(user: User | null | undefined): boolean {
  return isManagerOrAdmin(user);
}

// Verifica permissão para deletar
// Apenas Administrador pode deletar
export function canDelete(user: User | null | undefined): boolean {
  return isAdministrator(user);
}

// Verifica permissão para gerenciar usuários (editar roles)
// Apenas Administrador pode gerenciar usuários
export function canManageUsers(user: User | null | undefined): boolean {
  return isAdministrator(user);
}


