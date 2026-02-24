import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';
import { JOB_TITLES } from '../pages/users/constants';

export interface Cargo {
  id: string;
  name: string;
}

export interface CargoService {
  list(): Promise<Cargo[]>;
}

function createMockCargoService(): CargoService {
  return {
    async list() {
      return JOB_TITLES.map((name, i) => ({
        id: `mock-${i}`,
        name,
      }));
    },
  };
}

function createHttpCargoService(http: HttpClient): CargoService {
  return {
    async list() {
      const rows = await http.get<Cargo[]>('/cargos');
      return Array.isArray(rows) ? rows : [];
    },
  };
}

export function getCargoService(): CargoService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) {
    return createHttpCargoService(new HttpClient({ baseUrl }));
  }
  return createMockCargoService();
}
