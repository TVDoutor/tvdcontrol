import { HttpClient } from './httpClient';
import { getApiBaseUrl } from './apiBaseUrl';

export type CompanySettings = {
  id: string;
  name: string;
  legalName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  cnpj: string | null;
};

export type UpdateCompanySettingsInput = Partial<Omit<CompanySettings, 'id'>>;

export interface CompanySettingsService {
  get(): Promise<CompanySettings>;
  update(input: UpdateCompanySettingsInput): Promise<CompanySettings>;
}

function createMockCompanySettingsService(): CompanySettingsService {
  let settings: CompanySettings = {
    id: 'default',
    name: '',
    legalName: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    cnpj: null,
  };

  return {
    async get() {
      return { ...settings };
    },
    async update(input) {
      settings = { ...settings, ...input };
      return { ...settings };
    },
  };
}

function createHttpCompanySettingsService(http: HttpClient): CompanySettingsService {
  return {
    get() {
      return http.get<CompanySettings>('/company-settings');
    },
    update(input) {
      return http.put<CompanySettings>('/company-settings', {
        name: input.name,
        legalName: input.legalName,
        address: input.address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        cnpj: input.cnpj,
      });
    },
  };
}

export function getCompanySettingsService(): CompanySettingsService {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return createHttpCompanySettingsService(new HttpClient({ baseUrl }));
  return createMockCompanySettingsService();
}
