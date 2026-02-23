import React, { useEffect, useMemo, useState } from 'react';
import { getCompanySettingsService, type CompanySettings } from '../services/companySettingsService';
import { getFriendlyErrorMessage } from '../services/httpClient';
import { useAuthStore } from '../store/AuthStore';
import { isAdministrator } from '../utils/permissions';

function formatCnpj(v: string | null | undefined): string {
  if (!v || !v.trim()) return '';
  const d = v.replace(/\D/g, '');
  if (d.length !== 14) return v;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

const CompanySettings: React.FC = () => {
  const service = useMemo(() => getCompanySettingsService(), []);
  const { user } = useAuthStore();
  const canEdit = isAdministrator(user);

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cnpj: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await service.get();
      setSettings(data);
      setForm({
        name: data.name || '',
        legalName: data.legalName || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        cnpj: data.cnpj ? formatCnpj(data.cnpj) : '',
      });
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'general'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSave = () => {
    if (!canEdit) return;
    setIsSaving(true);
    setError(null);
    void (async () => {
      try {
        const updated = await service.update({
          name: form.name.trim() || undefined,
          legalName: form.legalName.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zip: form.zip.trim() || null,
          cnpj: form.cnpj.trim() ? form.cnpj.replace(/\D/g, '') : null,
        });
        setSettings(updated);
        setForm({
          name: updated.name || '',
          legalName: updated.legalName || '',
          address: updated.address || '',
          city: updated.city || '',
          state: updated.state || '',
          zip: updated.zip || '',
          cnpj: updated.cnpj ? formatCnpj(updated.cnpj) : '',
        });
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'general'));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
      <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
        <div className="flex-1 min-w-0 max-w-[640px] mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
              Configurações da Empresa
            </h1>
            <p className="text-text-sub-light dark:text-text-sub-dark mt-1">
              Dados utilizados nos Termos de Responsabilidade (PDF de recebimento e devolução).
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                Dados da Empresa
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {isLoading ? (
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">Carregando...</p>
              ) : (
                <>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Nome da empresa *</span>
                    <input
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      readOnly={!canEdit}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                      placeholder="Ex: S8 Mídia Dig"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Razão social</span>
                    <input
                      value={form.legalName}
                      onChange={(e) => handleChange('legalName', e.target.value)}
                      readOnly={!canEdit}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                      placeholder="Ex: S8 MÍDIA DIG PUBLICIDADE E PROPAGANDA LTDA – ME"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-main-light dark:text-slate-200">CNPJ</span>
                    <input
                      value={form.cnpj}
                      onChange={(e) => handleChange('cnpj', e.target.value)}
                      readOnly={!canEdit}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                      placeholder="00.000.000/0001-00"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Endereço</span>
                    <input
                      value={form.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      readOnly={!canEdit}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                      placeholder="Av. Exemplo, nº 123, Sala 1"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Cidade</span>
                      <input
                        value={form.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        readOnly={!canEdit}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                        placeholder="Campinas"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-text-main-light dark:text-slate-200">Estado</span>
                      <input
                        value={form.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        readOnly={!canEdit}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                        placeholder="SP"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-main-light dark:text-slate-200">CEP</span>
                    <input
                      value={form.zip}
                      onChange={(e) => handleChange('zip', e.target.value)}
                      readOnly={!canEdit}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark disabled:opacity-70"
                      placeholder="13000-000"
                    />
                  </label>

                  {canEdit && (
                    <div className="pt-4">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm disabled:opacity-60"
                      >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
