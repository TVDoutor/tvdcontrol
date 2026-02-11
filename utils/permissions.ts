import { User, type UserRole } from '../types';

// Verifica se uma role é válida
export function isValidRole(role: string): role is UserRole {
  return role === 'Administrador' || role === 'Gerente' || role === 'Usuario';
}

// Verifica se o usuário é Administrador
export function isAdministrator(user: User | null | undefined): boolean {
  return user?.role === 'Administrador';
}

// Verifica permissão para criar (somente Administrador)
export function canCreate(user: User | null | undefined): boolean {
  return isAdministrator(user);
}

// Verifica permissão para ler (somente Administrador)
export function canRead(user: User | null | undefined): boolean {
  return isAdministrator(user);
}

// Verifica permissão para atualizar (somente Administrador)
export function canUpdate(user: User | null | undefined): boolean {
  return isAdministrator(user);
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


