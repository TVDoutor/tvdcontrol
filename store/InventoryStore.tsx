import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { InventoryHistoryEvent, InventoryItem } from '../types';
import {
  getInventoryService,
  type CreateInventoryItemInput,
  type UpdateInventoryItemInput,
} from '../services/inventoryService';
import { useAuthStore } from './AuthStore';
import { getFriendlyErrorMessage } from '../services/httpClient';

type InventoryStoreValue = {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;

  getById: (id: string) => InventoryItem | undefined;
  refresh: () => Promise<void>;

  createItem: (input: CreateInventoryItemInput) => Promise<InventoryItem>;
  updateItem: (input: UpdateInventoryItemInput) => Promise<InventoryItem>;
  deleteItem: (id: string) => Promise<void>;

  historyById: Record<string, InventoryHistoryEvent[] | undefined>;
  loadHistory: (id: string) => Promise<void>;
  assignItem: (id: string, userId: string, options?: { signatureBase64?: string }) => Promise<{ documentId?: string } | void>;
  returnItem: (id: string, options?: { returnPhoto?: string; returnNotes?: string; returnItems?: string[]; signatureBase64?: string }) => Promise<void>;
};

const InventoryStoreContext = createContext<InventoryStoreValue | null>(null);

export function InventoryStoreProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => getInventoryService(), []);
  const { user } = useAuthStore();
  const userId = user?.id;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historyById, setHistoryById] = useState<Record<string, InventoryHistoryEvent[] | undefined>>({});

  const getById = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setHistoryById({});
      setError(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await service.list();
      setItems(data);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'general'));
    } finally {
      setIsLoading(false);
    }
  }, [service, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createItem = useCallback(
    async (input: CreateInventoryItemInput) => {
      const created = await service.create(input);
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [service]
  );

  const updateItem = useCallback(
    async (input: UpdateInventoryItemInput) => {
      const updated = await service.update(input);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    },
    [service]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await service.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setHistoryById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [service]
  );

  const loadHistory = useCallback(
    async (id: string) => {
      const events = await service.history(id);
      setHistoryById((prev) => ({ ...prev, [id]: events }));
    },
    [service]
  );

  const assignItem = useCallback(
    async (id: string, userId: string, options?: { signatureBase64?: string }) => {
      const result = await service.assign(id, userId, options);
      const updated = await service.get(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      void loadHistory(id).catch(() => {});
      return result;
    },
    [service, loadHistory]
  );

  const returnItem = useCallback(
    async (id: string, options?: { returnPhoto?: string; returnNotes?: string; returnItems?: string[] }) => {
      await service.returnItem(id, options);
      const updated = await service.get(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      // Carrega histórico em segundo plano; não bloqueia fechar o modal se falhar
      void loadHistory(id).catch(() => {});
    },
    [service, loadHistory]
  );

  const value: InventoryStoreValue = useMemo(
    () => ({
      items,
      isLoading,
      error,
      getById,
      refresh,
      createItem,
      updateItem,
      deleteItem,
      historyById,
      loadHistory,
      assignItem,
      returnItem,
    }),
    [items, isLoading, error, getById, refresh, createItem, updateItem, deleteItem, historyById, loadHistory, assignItem, returnItem]
  );

  return <InventoryStoreContext.Provider value={value}>{children}</InventoryStoreContext.Provider>;
}

export function useInventoryStore(): InventoryStoreValue {
  const ctx = useContext(InventoryStoreContext);
  if (!ctx) throw new Error('useInventoryStore must be used within InventoryStoreProvider');
  return ctx;
}
