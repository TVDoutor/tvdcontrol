import type { User } from '../types';
import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

export type AuthenticatedUserResponse = { user: User };
export type LoginResponse = AuthenticatedUserResponse & { token: string; refreshToken?: string };
export type RegisterResponse = AuthenticatedUserResponse & { token: string; refreshToken?: string };
export type RefreshResponse = { token: string; refreshToken?: string };
export type UpdateMeInput = { name?: string; department?: string; avatar?: string };
export type UpdateMeResponse = AuthenticatedUserResponse;
export type ChangePasswordInput = { currentPassword: string; newPassword: string };

export interface AuthService {
  login(email: string, password?: string): Promise<LoginResponse>;
  register(name: string, email: string, password: string): Promise<RegisterResponse>;
  me(): Promise<AuthenticatedUserResponse>;
  updateMe(input: UpdateMeInput): Promise<UpdateMeResponse>;
  changePassword(input: ChangePasswordInput): Promise<void>;
  refresh(): Promise<RefreshResponse>;
  logout(): Promise<void>;
}

function createNoAuthService(): AuthService {
  const fail = (): never => {
    throw new Error('API não configurada. Defina VITE_API_BASE_URL para usar autenticação real.');
  };

  return {
    async login() {
      return fail();
    },
    async register() {
      return fail();
    },
    async me() {
      return fail();
    },
    async updateMe() {
      return fail();
    },
    async changePassword() {
      return fail();
    },
    async refresh() {
      return fail();
    },
    async logout() {
      return fail();
    },
  };
}

function createHttpAuthService(http: HttpClient): AuthService {
  return {
    login(email: string, password?: string) {
      return http.post<LoginResponse>('/auth/login', { email, password });
    },
    register(name: string, email: string, password: string) {
      return http.post<RegisterResponse>('/auth/register', { name, email, password });
    },
    me() {
      return http.get<AuthenticatedUserResponse>('/auth/me');
    },
    updateMe(input: UpdateMeInput) {
      return http.put<UpdateMeResponse>('/auth/me', input);
    },
    async changePassword(input: ChangePasswordInput) {
      await http.put<void>('/auth/me/password', input);
    },
    refresh() {
      return http.post<RefreshResponse>('/auth/refresh', {});
    },
    async logout() {
      await http.post<void>('/auth/logout', {});
    },
  };
}

export function getAuthService(): AuthService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return createHttpAuthService(new HttpClient({ baseUrl }));
  return createNoAuthService();
}
