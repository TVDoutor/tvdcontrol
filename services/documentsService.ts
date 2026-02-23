import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

const TOKEN_STORAGE_KEY = 'tvdcontrol.auth.token';

export type InventoryDocument = {
  id: string;
  itemId: string;
  userId: string;
  type: 'recebimento' | 'devolucao';
  signedAt: string;
  historyEventId?: string | null;
  createdAt: string;
};

export interface DocumentsService {
  listByItem(itemId: string): Promise<InventoryDocument[]>;
  download(docId: string, filename?: string): Promise<void>;
}

function createMockDocumentsService(): DocumentsService {
  return {
    async listByItem() {
      return [];
    },
    async download() {},
  };
}

function createHttpDocumentsService(http: HttpClient): DocumentsService {
  const baseUrl = getApiBaseUrl() || '';
  return {
    async listByItem(itemId: string) {
      return http.get<InventoryDocument[]>(`/items/${encodeURIComponent(itemId)}/documents`);
    },
    async download(docId: string, filename?: string) {
      const url = `${baseUrl}/documents/${encodeURIComponent(docId)}/download`;
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      const res = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Falha ao baixar documento');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename || `termo-${docId}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  };
}

export function getDocumentsService(): DocumentsService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return createHttpDocumentsService(new HttpClient({ baseUrl }));
  return createMockDocumentsService();
}
