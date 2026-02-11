import React, { useEffect, useMemo, useState } from 'react';
import { getCategoriesService, type Category } from '../services/categoriesService';
import { getFriendlyErrorMessage } from '../services/httpClient';

const Categories: React.FC = () => {
  const service = useMemo(() => getCategoriesService(), []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rows = await service.list();
      setCategories(rows);
    } catch (e) {
      setError(getFriendlyErrorMessage(e, 'general'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = () => {
    const name = newCategory.trim();
    if (!name) return;
    setIsSaving(true);
    setError(null);
    void (async () => {
      try {
        const created = await service.create(name);
        setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setNewCategory('');
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'general'));
      } finally {
        setIsSaving(false);
      }
    })();
  };

  const handleDelete = (category: Category) => {
    const ok = window.confirm(`Deseja remover a categoria "${category.name}"?`);
    if (!ok) return;
    setError(null);
    void (async () => {
      try {
        await service.remove(category.id);
        setCategories((prev) => prev.filter((c) => c.id !== category.id));
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'general'));
      }
    })();
  };

  return (
    <div className="flex flex-1 flex-col min-w-0 bg-background-light dark:bg-background-dark overflow-y-auto h-full relative">
      <div className="flex flex-1 p-4 md:p-8 gap-8 overflow-hidden h-full">
        <div className="flex-1 min-w-0 max-w-[960px] mx-auto w-full">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">Cadastro de Categorias</h1>
              <p className="text-text-sub-light dark:text-text-sub-dark mt-1">Gerencie as categorias de equipamentos do inventário.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Nova Categoria</h2>
            </div>
            <div className="p-6 flex flex-col md:flex-row gap-3">
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ex: Impressoras"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-sm bg-background-light dark:bg-background-dark"
              />
              <button
                onClick={handleCreate}
                disabled={isSaving || !newCategory.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 shadow-sm disabled:opacity-60"
              >
                {isSaving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden mt-6">
            <div className="p-6 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Categorias Cadastradas</h2>
            </div>
            <div className="p-6">
              {isLoading ? (
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">Carregando categorias...</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-text-sub-light dark:text-text-sub-dark">Nenhuma categoria cadastrada.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between rounded-lg border border-border-light dark:border-border-dark px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">{category.name}</span>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;

