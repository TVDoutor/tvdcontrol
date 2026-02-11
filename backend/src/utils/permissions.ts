// Tipos de roles válidas
export type UserRole = 'Administrador' | 'Gerente' | 'Usuario';

// Verifica se uma role é válida
export function isValidRole(role: string): role is UserRole {
  return role === 'Administrador' || role === 'Gerente' || role === 'Usuario';
}

// Verifica se o usuário é Administrador
export function isAdministrator(role: string | null | undefined): boolean {
  return role === 'Administrador';
}

// Verifica permissão para criar (somente Administrador)
export function canCreate(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

// Verifica permissão para ler (somente Administrador)
export function canRead(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

// Verifica permissão para atualizar (somente Administrador)
export function canUpdate(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

// Verifica permissão para deletar
// Apenas Administrador pode deletar
export function canDelete(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

// Verifica permissão para gerenciar usuários (editar roles)
// Apenas Administrador pode gerenciar usuários
export function canManageUsers(role: string | null | undefined): boolean {
  return isAdministrator(role);
}

