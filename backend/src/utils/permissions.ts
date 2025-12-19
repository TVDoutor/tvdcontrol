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

// Verifica se o usuário é Gerente ou Administrador
export function isManagerOrAdmin(role: string | null | undefined): boolean {
  return role === 'Administrador' || role === 'Gerente';
}

// Verifica permissão para criar (todos podem criar)
export function canCreate(role: string | null | undefined): boolean {
  return isValidRole(role || '');
}

// Verifica permissão para ler (todos podem ler)
export function canRead(role: string | null | undefined): boolean {
  return isValidRole(role || '');
}

// Verifica permissão para atualizar
// Administrador e Gerente podem atualizar
export function canUpdate(role: string | null | undefined): boolean {
  return isManagerOrAdmin(role);
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


