import type { User } from '../types';
import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

const TOKEN_STORAGE_KEY = 'tvdcontrol.auth.token';

export type CreateUserInput = Omit<User, 'id' | 'itemsCount'> & { itemsCount?: number; password?: string };
export type UpdateUserInput = Partial<Omit<User, 'id'>> & { id: string; password?: string };

export interface UsersService {
  list(): Promise<User[]>;
  create(input: CreateUserInput): Promise<User>;
  update(input: UpdateUserInput): Promise<User>;
  remove(id: string): Promise<void>;
  downloadTermoItens(userId: string, filename?: string): Promise<void>;
}

function createId(): string {
  // Simple client-side ID; backend should generate stable IDs in production.
  return Date.now().toString();
}

function createMockUsersService(): UsersService {
  // Mirrors the current Users.tsx initial mock.
  let users: User[] = [
    {
      id: 'admin',
      name: 'Ana Silva',
      email: 'admin@tvdcontrol.com',
      role: 'Administrador',
      department: 'Diretoria',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBVaALDdkXZEakGv-aNod9NCb-2GkYppHOzw9oubYd8sdoJNsvv4JM0DHkgBRqOy64FolHrmbTZGX9lEZqT8T9dkS_4I2XnqNYUoVS1PWJeUwM0Uoy7bpZiRa55Uyg4e3mLYg2X3YfCRkBakOiaMCCqjkBhEQFAyNjUYt-pY5j0YnI7GHnVnW9qf4C9tPi6ESIYQoaMufD37bvDhpdeDd11IZQup2XqG9mR2vhdVtNXhJ5CZLtYdlSeYVar1DPILY-ifbocYRtCa5A',
      itemsCount: 12,
      status: 'active',
    },
    {
      id: '1',
      name: 'Carlos Mendes',
      email: 'carlos.m@empresa.com',
      role: 'Administrador',
      department: 'TI',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAi_ovget7gPlpDSqBP8Jn0k5FeGKjusgh0xFdi9ga1cloftOo_IVAYngAWT3bab5GRyxz1xcKdO9vP9WNB02H8XeDrAA_Sme1hCML9UPRLezgIku6dy5ZO-20DwKrntcnSXAI0K5J4TjYekIgEHzsYH-DJOm0Q9qWAFKOILHjbvBwlsHtakHJBHx1FaUhTi9B_l0kt91jgM4I89LReoJI_wQxZEgg8ZXlnKTjkexSbHgpfY4ndOpT_pxQZcl3MHWckxnLL8uKXlM0',
      itemsCount: 3,
      status: 'active',
    },
    {
      id: '2',
      name: 'Mariana Jones',
      email: 'mariana.j@empresa.com',
      role: 'Usuario',
      department: 'Criação',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBbGIA-lE6JAC8kMS-geX8694U8CNcMS7Mrt_W-4b2JKO3DGoSJVpFguTeXRLi9tgkoFrd9F4RUQwDhlLCW-eD4gaBcrQyJrCFPUDnR2vqSRvQ9yiz1oeMcMHCmj3hv4MBSK05UcNtZcoinRcqPxZAG3-q4FOnPWqwgoEfngpwZfTJO4uTknX1Wtj23h6Gz8ElpQ8stkCJh-0SA8NKQ8E1z6pGFbNUE7ELxEC47U1fuJk80yEtMjvyJPkisb4sysnn33Z8hmiyhzZw',
      itemsCount: 2,
      status: 'active',
    },
    {
      id: '3',
      name: 'Roberto Silva',
      email: 'roberto.silva@empresa.com',
      role: 'Usuario',
      department: 'Vendas',
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA8P1DqqdhdtH-4gBWtsPEMTqC4pjjWOV4lD9VemS3RMgqKIoT0ABhzRsnrm3kSD3R747iBrG-lTwiWRx1a0krQ_9QLbL01x8hHRkcNl6YYktSol942Gm0RzmI0lZnj4dlN8vf9S9QwWdwUmUxktiuH6oWbpUx-999OL1TFdcGUmkwlS9OZjHjOUlAF-cdHB2HfM6eZpS7Dn4ZoX3TOIxKQnBwtmTisfEMleUIZlkDsaFLlQSx3rhM4Ds8KTADuVI7w0w8nKYwmYko',
      itemsCount: 0,
      status: 'inactive',
    },
  ];

  return {
    async list() {
      return [...users];
    },
    async create(input) {
      const { password: _password, ...userInput } = input;
      const newUser: User = {
        id: createId(),
        itemsCount: input.itemsCount ?? 0,
        ...userInput,
      };
      users = [newUser, ...users];
      return newUser;
    },
    async update(input) {
      const { password: _password, ...userPatch } = input;
      const idx = users.findIndex((u) => u.id === input.id);
      if (idx === -1) throw new Error('User not found');
      const updated: User = { ...users[idx], ...userPatch };
      users = users.map((u) => (u.id === input.id ? updated : u));
      return updated;
    },
    async remove(id) {
      users = users.filter((u) => u.id !== id);
    },
    async downloadTermoItens() {
      // Mock: no-op
    },
  };
}

function createHttpUsersService(http: HttpClient): UsersService {
  // Proposed contract:
  // GET    /users
  // POST   /users
  // PUT    /users/:id
  // DELETE /users/:id
  return {
    list() {
      return http.get<User[]>('/users');
    },
    create(input) {
      return http.post<User>('/users', input);
    },
    update(input) {
      const { id, ...body } = input;
      return http.put<User>(`/users/${encodeURIComponent(id)}`, body);
    },
    async remove(id) {
      await http.delete<void>(`/users/${encodeURIComponent(id)}`);
    },
    async downloadTermoItens(userId: string, filename?: string) {
      const baseUrl = getApiBaseUrl() || '';
      const url = `${baseUrl}/users/${encodeURIComponent(userId)}/termo-itens`;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Falha ao baixar termo');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || `termo-itens-usuario.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}

export function getUsersService(): UsersService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return createHttpUsersService(new HttpClient({ baseUrl }));
  }
  return createMockUsersService();
}


