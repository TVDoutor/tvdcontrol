import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import { getUsersService, type CreateUserInput, type UpdateUserInput } from '../services/usersService';
import { useAuthStore } from './AuthStore';
import { getFriendlyErrorMessage } from '../services/httpClient';
import { canListUsers } from '../utils/permissions';

type UsersStoreValue = {
  users: User[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createUser: (input: CreateUserInput) => Promise<User>;
  updateUser: (input: UpdateUserInput) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
};

const UsersStoreContext = createContext<UsersStoreValue | null>(null);

export function UsersStoreProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => getUsersService(), []);
  const { user } = useAuthStore();
  const userId = user?.id;
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !canListUsers(user)) {
      setUsers([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await service.list();
      const filtered =
        user?.role === 'Gerente' ? data.filter((u) => u.role === 'Usuario') : data;
      setUsers(filtered);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'general'));
    } finally {
      setIsLoading(false);
    }
  }, [service, userId, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createUser = useCallback(
    async (input: CreateUserInput) => {
      const created = await service.create(input);
      setUsers((prev) => [created, ...prev]);
      return created;
    },
    [service]
  );

  const updateUser = useCallback(
    async (input: UpdateUserInput) => {
      const updated = await service.update(input);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      return updated;
    },
    [service]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      await service.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    },
    [service]
  );

  const value: UsersStoreValue = useMemo(
    () => ({ users, isLoading, error, refresh, createUser, updateUser, deleteUser }),
    [users, isLoading, error, refresh, createUser, updateUser, deleteUser]
  );

  return <UsersStoreContext.Provider value={value}>{children}</UsersStoreContext.Provider>;
}

export function useUsersStore(): UsersStoreValue {
  const ctx = useContext(UsersStoreContext);
  if (!ctx) throw new Error('useUsersStore must be used within UsersStoreProvider');
  return ctx;
}


