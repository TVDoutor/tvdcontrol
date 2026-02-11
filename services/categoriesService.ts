import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

export type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface CategoriesService {
  list(): Promise<Category[]>;
  create(name: string): Promise<Category>;
  remove(id: string): Promise<void>;
}

function createMockCategoriesService(): CategoriesService {
  let categories: Category[] = [
    { id: '1', name: 'Notebook' },
    { id: '2', name: 'Computadores' },
    { id: '3', name: 'Celulares' },
    { id: '4', name: 'Monitores' },
    { id: '5', name: 'Periféricos' },
    { id: '6', name: 'Chips' },
    { id: '7', name: 'Acessórios' },
  ];

  return {
    async list() {
      return [...categories].sort((a, b) => a.name.localeCompare(b.name));
    },
    async create(name: string) {
      const exists = categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) throw new Error('Categoria já cadastrada');
      const created: Category = { id: Date.now().toString(), name: name.trim() };
      categories = [...categories, created];
      return created;
    },
    async remove(id: string) {
      categories = categories.filter((c) => c.id !== id);
    },
  };
}

function createHttpCategoriesService(http: HttpClient): CategoriesService {
  return {
    list() {
      return http.get<Category[]>('/categories');
    },
    create(name: string) {
      return http.post<Category>('/categories', { name });
    },
    async remove(id: string) {
      await http.delete<void>(`/categories/${encodeURIComponent(id)}`);
    },
  };
}

export function getCategoriesService(): CategoriesService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return createHttpCategoriesService(new HttpClient({ baseUrl }));
  return createMockCategoriesService();
}

