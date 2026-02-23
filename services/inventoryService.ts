import type { InventoryHistoryEvent, InventoryItem } from '../types';
import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

export type CreateInventoryItemInput = Omit<InventoryItem, 'id'>;
export type UpdateInventoryItemInput = Partial<Omit<InventoryItem, 'id'>> & { id: string };

export interface InventoryService {
  list(): Promise<InventoryItem[]>;
  get(id: string): Promise<InventoryItem>;
  nextAssetTag(): Promise<string>;
  create(input: CreateInventoryItemInput): Promise<InventoryItem>;
  update(input: UpdateInventoryItemInput): Promise<InventoryItem>;
  remove(id: string): Promise<void>;
  history(id: string): Promise<InventoryHistoryEvent[]>;
  assign(id: string, userId: string): Promise<void>;
  returnItem(id: string, options?: { returnPhoto?: string; returnNotes?: string; returnItems?: string }): Promise<void>;
}

function createId(): string {
  return Date.now().toString();
}

function createMockInventoryService(): InventoryService {
  let items: InventoryItem[] = [];

  return {
    async list() {
      return [...items];
    },
    async get(id: string) {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error('Item not found');
      return item;
    },
    async create(input) {
      const newItem: InventoryItem = {
        id: createId(),
        ...input,
      };
      items = [newItem, ...items];
      return newItem;
    },
    async update(input) {
      const { id, ...body } = input;
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      const updated: InventoryItem = { ...items[idx], ...body };
      items = items.map((i) => (i.id === id ? updated : i));
      return updated;
    },
    async remove(id: string) {
      items = items.filter((i) => i.id !== id);
    },
    async history(id: string) {
      // Mock: retorna histórico vazio
      return [];
    },
    async assign(id: string, userId: string) {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error('Item not found');
      item.assignedTo = userId;
      item.status = 'in_use';
    },
    async     returnItem(id: string, _options?: { returnPhoto?: string; returnNotes?: string; returnItems?: string }) {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error('Item not found');
      item.assignedTo = undefined;
      item.status = 'available';
    },
    async nextAssetTag() {
      const numericTags = items
        .map((item) => (item.sku || '').trim())
        .map((raw) => {
          const match = raw.match(/(\d+)$/);
          return match ? Number.parseInt(match[1], 10) : NaN;
        })
        .filter((value) => Number.isFinite(value));

      const next = (numericTags.length ? Math.max(...numericTags) : 0) + 1;
      return `#${String(next).padStart(6, '0')}`;
    },
  };
}

function createHttpInventoryService(http: HttpClient): InventoryService {
  return {
    list() {
      return http.get<InventoryItem[]>('/items');
    },
    get(id: string) {
      return http.get<InventoryItem>(`/items/${encodeURIComponent(id)}`);
    },
    async nextAssetTag() {
      const response = await http.get<{ value: string }>('/items/meta/next-asset-tag');
      return response.value;
    },
    create(input) {
      return http.post<InventoryItem>('/items', input);
    },
    update(input) {
      const { id, ...body } = input;
      return http.put<InventoryItem>(`/items/${encodeURIComponent(id)}`, body);
    },
    async remove(id: string) {
      await http.delete<void>(`/items/${encodeURIComponent(id)}`);
    },
    history(id: string) {
      return http.get<InventoryHistoryEvent[]>(`/items/${encodeURIComponent(id)}/history`);
    },
    assign(id: string, userId: string) {
      return http.post<void>(`/items/${encodeURIComponent(id)}/assign`, { userId });
    },
    returnItem(id: string, options?: { returnPhoto?: string; returnNotes?: string; returnItems?: string }) {
      return http.post<void>(`/items/${encodeURIComponent(id)}/return`, {
        returnPhoto: options?.returnPhoto ?? null,
        returnNotes: options?.returnNotes ?? null,
        returnItems: options?.returnItems ?? null,
      });
    },
  };
}

export function getInventoryService(): InventoryService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return createHttpInventoryService(new HttpClient({ baseUrl }));
  }
  return createMockInventoryService();
}

