import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store/InventoryStore';
import { useUsersStore } from '../store/UsersStore';
import type { InventoryItem } from '../types';
import { DropdownField } from '../components/Dropdown';
import { getCategoryIcon } from './addItem/constants';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { items, isLoading, error, refresh } = useInventoryStore();
  const { users } = useUsersStore();

  // Sincroniza com o restante do sistema ao visitar o Dashboard
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
      category: 'all',
      status: 'all'
  });

  const getStatusLabel = (status: InventoryItem['status']) => {
    switch (status) {
      case 'available':
        return 'Disponível';
      case 'in_use':
        return 'Em uso';
      case 'maintenance':
        return 'Manutenção';
      case 'retired':
        return 'Desativado';
      default:
        return status;
    }
  };

  // Derived state for filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
        // Text Search Logic
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = 
            (item.name || '').toLowerCase().includes(lowerQuery) ||
            (item.model || '').toLowerCase().includes(lowerQuery) ||
            (item.desc || item.specs || '').toLowerCase().includes(lowerQuery) ||
            (item.sku || '').toLowerCase().includes(lowerQuery) ||
            (item.category || '').toLowerCase().includes(lowerQuery) ||
            (item.location || '').toLowerCase().includes(lowerQuery) ||
            (() => {
              const qd = searchQuery.replace(/\D/g, '');
              if (qd.length > 0) {
                return (item.phoneNumber || '').replace(/\D/g, '').includes(qd);
              }
              return (item.phoneNumber || '').toLowerCase().includes(lowerQuery);
            })() ||
            getStatusLabel(item.status).toLowerCase().includes(lowerQuery);

        // Category Filter Logic
        const matchesCategory = activeFilters.category === 'all' || item.category === activeFilters.category;

        // Status Filter Logic (usa assignedTo para corrigir inconsistência)
        const effectiveStatus = item.assignedTo ? 'in_use' : item.status;
        const matchesStatus = activeFilters.status === 'all' || effectiveStatus === activeFilters.status;

        return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, activeFilters, getStatusLabel]);

  // Export to CSV Function
  const handleExport = () => {
      const headers = ["Item", "Modelo/Desc", "SKU", "Categoria", "Status", "Alocado a"];
      const csvContent = [
          headers.join(","),
          ...filteredItems.map(item => [
              `"${item.name || item.model || ''}"`,
              `"${item.desc || item.manufacturer || ''}"`,
              item.sku || '',
              item.category,
              getStatusLabel(item.assignedTo ? 'in_use' : item.status),
              `"${item.assignedTo ? getUserName(item.assignedTo) : ''}"`
          ].join(","))
      ].join("\n");

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "inventario_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const clearFilters = () => {
      setActiveFilters({ category: 'all', status: 'all' });
      setSearchQuery('');
      setIsFilterOpen(false);
  };

  const getUserName = (userId: string | undefined) =>
    userId ? users.find((u) => u.id === userId)?.name ?? '–' : '–';

  // Pagination
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  useEffect(() => {
    setCurrentPage((p) => (p > totalPages && totalPages >= 1 ? totalPages : p));
  }, [totalPages]);

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))),
    [items]
  );

  const totalItems = items.length;
  const effectiveStatus = (i: InventoryItem) => (i.assignedTo ? 'in_use' : i.status);
  const inUseCount = items.filter((i) => effectiveStatus(i) === 'in_use').length;
  const availableCount = items.filter((i) => effectiveStatus(i) === 'available').length;
  const maintenanceCount = items.filter((i) => effectiveStatus(i) === 'maintenance').length;

  const chartData = useMemo(
    () => {
      const byCategory: Record<string, number> = {};
      items.forEach((item) => {
        const cat = item.category || 'Outros';
        byCategory[cat] = (byCategory[cat] ?? 0) + 1;
      });
      return Object.entries(byCategory).map(([name, value]) => ({
        name,
        value,
        color: '#3b82f6',
      }));
    },
    [items]
  );

  return (
    <div className="flex-1 px-4 py-6 sm:px-8 bg-background-light dark:bg-background-dark overflow-y-auto relative scroll-smooth">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Erro ao carregar inventário: {error}
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsFilterOpen(false)}>
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Filtrar Inventário</h3>
                      <button onClick={() => setIsFilterOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                      <DropdownField
                        label="Categoria"
                        value={activeFilters.category}
                        options={[
                          { value: 'all', label: 'Todas as Categorias', icon: 'category' },
                          ...uniqueCategories.map((cat) => ({ value: cat, label: cat, icon: 'category' })),
                        ]}
                        wrapperClassName="flex flex-col gap-2"
                        labelClassName="text-sm font-semibold text-slate-700 dark:text-slate-300"
                        buttonClassName="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-11 px-3 outline-none transition-all text-left flex items-center justify-between cursor-pointer"
                        onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, category: value }))}
                      />
                      <DropdownField
                        label="Status"
                        value={activeFilters.status}
                        options={[
                          { value: 'all', label: 'Todos os Status', icon: 'list' },
                          { value: 'available', label: 'Disponível', icon: 'check_circle' },
                          { value: 'in_use', label: 'Em uso', icon: 'devices' },
                          { value: 'maintenance', label: 'Manutenção', icon: 'build' },
                          { value: 'retired', label: 'Desativado', icon: 'block' },
                        ]}
                        wrapperClassName="flex flex-col gap-2"
                        labelClassName="text-sm font-semibold text-slate-700 dark:text-slate-300"
                        buttonClassName="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-11 px-3 outline-none transition-all text-left flex items-center justify-between cursor-pointer"
                        onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, status: value }))}
                      />
                  </div>
                  <div className="p-4 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 flex gap-3">
                      <button onClick={clearFilters} className="flex-1 py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Limpar</button>
                      <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-2 px-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm">Aplicar Filtros</button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-8 pb-10">
        
        {/* Header (Simplified since Layout handles main structure) */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-1">
                <h2 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Dashboard de Inventário</h2>
                <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">Visão geral do estoque e movimentações recentes</p>
            </div>
        </div>

        {/* KPI Stats */}
        <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <StatCard title="Total de Ativos" value={String(totalItems)} change="" isPositive={true} icon="inventory" color="blue" />
          <StatCard title="Em Uso" value={String(inUseCount)} change="" isPositive={true} icon="devices" color="purple" />
          <StatCard title="Em Manutenção" value={String(maintenanceCount)} change="" isPositive={true} icon="build" color="orange" />
          <StatCard title="Disponíveis" value={String(availableCount)} change="" isPositive={true} icon="check_circle" color="teal" />
        </section>

        {/* Chart Section */}
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Distribuição por Categoria</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Itens atuais agrupados por categoria</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              Atual
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--bg-surface-light, #fff)' }}
                />
                <Bar dataKey="value" fill="#137fec" radius={[4, 4, 0, 0]} barSize={40} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Inventory Table Section */}
        <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
           {/* Controls */}
           <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
             <div className="relative flex-1 max-w-lg group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                 <span className="material-symbols-outlined text-slate-400">search</span>
               </div>
               <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-shadow" 
                  placeholder="Buscar por nome, modelo, SKU, categoria, telefone ou status..." 
                  type="text"
               />
             </div>
             
             <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               <button 
                  onClick={() => setIsFilterOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border ${activeFilters.category !== 'all' || activeFilters.status !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'} rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shadow-sm transition-colors active:scale-95 duration-150`}
               >
                 <span className="material-symbols-outlined text-[20px]">filter_list</span>
                 Filtros {(activeFilters.category !== 'all' || activeFilters.status !== 'all') && <span className="size-2 rounded-full bg-primary animate-pulse"></span>}
               </button>
               <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shadow-sm transition-colors active:scale-95 duration-150"
               >
                 <span className="material-symbols-outlined text-[20px]">download</span>
                 Exportar
               </button>
             </div>
           </div>

           {/* Table */}
           <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm flex flex-col">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Item / Modelo</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">SKU</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Categoria</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Alocado a</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400">
                          Carregando inventário...
                        </td>
                      </tr>
                    ) : filteredItems.length > 0 ? (
                        paginatedItems.map((item, index) => (
                            <TableRow 
                                key={item.id}
                                id={item.id}
                                icon={getCategoryIcon(item.category)} 
                                name={item.model || item.name} 
                                desc={
                                  item.model
                                    ? (item.name || item.manufacturer || item.desc)
                                    : (item.manufacturer || item.desc)
                                } 
                                sku={item.sku || '-'} 
                                category={item.category} 
                                status={item.assignedTo ? 'in_use' : item.status}
                                assignedUserName={item.assignedTo ? getUserName(item.assignedTo) : undefined}
                                index={startIndex + index}
                                onOpen={(id) => navigate(`/item/${id}`)}
                            />
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="p-12 text-center text-slate-500 dark:text-slate-400">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[32px] text-slate-400">search_off</span>
                                    </div>
                                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Nenhum item encontrado</p>
                                    <p className="text-sm">Tente ajustar seus filtros ou termos de busca.</p>
                                    <button 
                                        onClick={clearFilters}
                                        className="mt-2 text-primary font-bold hover:underline"
                                    >
                                        Limpar todos os filtros
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                 </tbody>
               </table>
             </div>
             <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    Mostrando {filteredItems.length > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length)} de {filteredItems.length} itens filtrados
                </span>
                <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-primary text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próxima
                    </button>
                </div>
             </div>
           </div>
        </section>

      </div>
    </div>
  );
};

// Helper Components for Dashboard
const StatCard = ({ title, value, change, isPositive, icon, color }: any) => {
    const colorClasses: Record<string, string> = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-primary',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        teal: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
    };

    return (
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <p className="text-slate-600 dark:text-slate-400 text-base font-medium">{title}</p>
                <span className={`${colorClasses[color]} rounded-full p-1.5 flex items-center justify-center`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{value}</p>
                <span className={`${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} text-sm font-medium flex items-center`}>
                    <span className="material-symbols-outlined text-[16px]">{isPositive ? 'trending_up' : 'trending_down'}</span>
                    {change}
                </span>
            </div>
        </div>
    );
};

type TableRowProps = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  sku: string;
  category: string;
  status: InventoryItem['status'];
  assignedUserName?: string;
  index: number;
  onOpen: (id: string) => void;
};

const TableRow: React.FC<TableRowProps> = ({ id, icon, name, desc, sku, category, status, assignedUserName, index, onOpen }) => {
    const statusMeta =
        status === 'available'
            ? { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', label: 'Disponível' }
            : status === 'in_use'
                ? { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', label: 'Em uso' }
                : status === 'maintenance'
                    ? { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', label: 'Manutenção' }
                    : { dot: 'bg-slate-400', text: 'text-slate-700 dark:text-slate-300', label: 'Desativado' };

    return (
    <tr 
        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => onOpen(id)}
    >
        <td className="p-4">
            <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg w-10 h-10 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600">
                    <span className="material-symbols-outlined transition-transform group-hover:scale-110">{icon}</span>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                </div>
            </div>
        </td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{sku}</td>
        <td className="p-4"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{category}</span></td>
        <td className="p-4">
            <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}></span>
                <span className={`text-sm font-medium ${statusMeta.text}`}>
                    {statusMeta.label}
                </span>
            </div>
        </td>
        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
            {assignedUserName ?? '–'}
        </td>
        <td className="p-4 text-right">
             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    className="text-slate-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Ver detalhes"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen(id);
                    }}
                >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
            </div>
        </td>
    </tr>
    );
};

export default Dashboard;
