import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import { getAuthService } from '../services/authService';
import { getApiBaseUrl } from '../services/apiBaseUrl';
import { getFriendlyErrorMessage } from '../services/httpClient';
import type { ChangePasswordInput, UpdateMeInput } from '../services/authService';

type AuthStoreValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (input: UpdateMeInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<void>;
  logout: () => void;
};

const USER_STORAGE_KEY = 'tvdcontrol.auth.user';
const TOKEN_STORAGE_KEY = 'tvdcontrol.auth.token';
const TOKEN_UPDATED_EVENT = 'tvdcontrol.auth.token.updated';

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUserToStorage(user: User | null) {
  try {
    if (!user) localStorage.removeItem(USER_STORAGE_KEY);
    else localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

function loadTokenFromStorage(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveTokenToStorage(token: string | null) {
  try {
    if (!token) localStorage.removeItem(TOKEN_STORAGE_KEY);
    else localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthStoreProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => getAuthService(), []);
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [token, setToken] = useState<string | null>(() => loadTokenFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string | null>).detail;
      if (typeof detail === 'string' && detail.trim()) {
        setToken(detail);
        return;
      }
      setUser(null);
      saveUserToStorage(null);
      setToken(null);
      saveTokenToStorage(null);
      setError(null);
    };
    window.addEventListener(TOKEN_UPDATED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(TOKEN_UPDATED_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      setIsLoading(false);
      setError(null);
      setUser(null);
      saveUserToStorage(null);
      setToken(null);
      saveTokenToStorage(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        const currentToken = loadTokenFromStorage();
        let hasToken = Boolean(currentToken);
        if (!hasToken) {
          try {
            await service.refresh();
            hasToken = Boolean(loadTokenFromStorage());
          } catch {
            hasToken = false;
          }
        }

        if (!hasToken) {
          if (cancelled) return;
          setUser(null);
          saveUserToStorage(null);
          setToken(null);
          saveTokenToStorage(null);
          return;
        }

        const { user: verified } = await service.me();
        if (cancelled) return;
        setUser(verified);
        saveUserToStorage(verified);
        setToken(loadTokenFromStorage());
      } catch {
        if (cancelled) return;
        setUser(null);
        saveUserToStorage(null);
        setToken(null);
        saveTokenToStorage(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [service]);

  const login = useCallback(
    async (email: string, password?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { user: loggedUser, token: receivedToken } = await service.login(email, password);
        setUser(loggedUser);
        setToken(receivedToken);
        saveUserToStorage(loggedUser);
        saveTokenToStorage(receivedToken);
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'login'));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const { user: registeredUser, token: receivedToken } = await service.register(name, email, password);
        setUser(registeredUser);
        setToken(receivedToken);
        saveUserToStorage(registeredUser);
        saveTokenToStorage(receivedToken);
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'register'));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const updateProfile = useCallback(
    async (input: UpdateMeInput) => {
      setIsLoading(true);
      setError(null);
      try {
        const { user: nextUser } = await service.updateMe(input);
        setUser(nextUser);
        saveUserToStorage(nextUser);
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'general'));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const changePassword = useCallback(
    async (input: ChangePasswordInput) => {
      setIsLoading(true);
      setError(null);
      try {
        await service.changePassword(input);
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'general'));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const logout = useCallback(() => {
    void service.logout().catch(() => {});
    setUser(null);
    setToken(null);
    setError(null);
    saveUserToStorage(null);
    saveTokenToStorage(null);
  }, [service]);

  const value: AuthStoreValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      login,
      register,
      updateProfile,
      changePassword,
      logout,
    }),
    [user, token, isLoading, error, login, register, updateProfile, changePassword, logout]
  );

  return <AuthStoreContext.Provider value={value}>{children}</AuthStoreContext.Provider>;
}

export function useAuthStore(): AuthStoreValue {
  const ctx = useContext(AuthStoreContext);
  if (!ctx) throw new Error('useAuthStore must be used within AuthStoreProvider');
  return ctx;
}
