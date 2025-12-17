import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

// Mock Data moved outside component to simulates DB
const initialInventoryData = [
  { id: 1, icon: "laptop_mac", name: 'MacBook Pro M1 14"', desc: 'Apple Silicon', sku: 'AST-00124', category: 'Computadores', qty: 15, status: 'available' },
  { id: 2, icon: "smartphone", name: 'iPhone 13 128GB', desc: 'Midnight Blue', sku: 'AST-02399', category: 'Celulares', qty: 4, status: 'low' },
  { id: 3, icon: "sim_card", name: 'Vivo SIM 4G/5G', desc: 'Corporativo', sku: 'SIM-9921', category: 'Chips', qty: 50, status: 'available' },
  { id: 4, icon: "monitor", name: 'Dell UltraSharp 27"', desc: 'U2720Q 4K', sku: 'MON-44211', category: 'Monitores', qty: 8, status: 'available' },
  { id: 5, icon: "keyboard", name: 'Logitech MX Keys', desc: 'Wireless', sku: 'PER-11234', category: 'Periféricos', qty: 22, status: 'available' },
  { id: 6, icon: "smartphone", name: 'Samsung S23 Ultra', desc: 'Phantom Black', sku: 'AST-02400', category: 'Celulares', qty: 2, status: 'low' },
];

const chartData = [
  { name: 'PC', value: 65, color: '#3b82f6' },
  { name: 'Mac', value: 45, color: '#3b82f6' },
  { name: 'iPhone', value: 35, color: '#3b82f6' },
  { name: 'Android', value: 25, color: '#3b82f6' },
  { name: 'SIM', value: 85, color: '#3b82f6' },
  { name: 'Modem', value: 15, color: '#3b82f6' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(initialInventoryData);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
      category: 'all',
      status: 'all'
  });

  // Low Stock Alert States
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);
  const [lowStockItems, setLowStockItems] = useState<typeof initialInventoryData>([]);

  // Check for low stock on mount
  useEffect(() => {
      const criticalItems = items.filter(item => item.qty <= 2);
      if (criticalItems.length > 0) {
          setLowStockItems(criticalItems);
          // Small delay for better UX (don't pop immediately on render)
          const timer = setTimeout(() => setShowLowStockAlert(true), 1000);
          return () => clearTimeout(timer);
      }
  }, [items]);

  // Derived state for filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
        // Text Search Logic
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.desc.toLowerCase().includes(lowerQuery) ||
            item.sku.toLowerCase().includes(lowerQuery) ||
            item.category.toLowerCase().includes(lowerQuery) ||
            (item.status === 'available' ? 'disponível' : 'baixo estoque').includes(lowerQuery);

        // Category Filter Logic
        const matchesCategory = activeFilters.category === 'all' || item.category === activeFilters.category;

        // Status Filter Logic
        const matchesStatus = activeFilters.status === 'all' || item.status === activeFilters.status;

        return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, activeFilters]);

  // Export to CSV Function
  const handleExport = () => {
      // Define headers
      const headers = ["Item", "Modelo/Desc", "SKU", "Categoria", "Quantidade", "Status"];
      
      // Convert data to CSV format
      const csvContent = [
          headers.join(","), // Header row
          ...filteredItems.map(item => [
              `"${item.name}"`,
              `"${item.desc}"`,
              item.sku,
              item.category,
              item.qty,
              item.status === 'available' ? 'Disponível' : 'Baixo Estoque'
          ].join(",")) // Data rows
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

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
      setActiveFilters({ category: 'all', status: 'all' });
      setSearchQuery('');
      setIsFilterOpen(false);
  };

  // Handler for low stock item click
  const handleReviewItem = (id: number) => {
      setShowLowStockAlert(false);
      navigate(`/item/${id}`);
  };

  // Extract unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="flex-1 px-4 py-6 sm:px-8 bg-background-light dark:bg-background-dark overflow-y-auto relative scroll-smooth">
      
      {/* Low Stock Alert Modal */}
      {showLowStockAlert && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-red-100 dark:border-red-900/30 animate-in zoom-in-95 duration-200">
                  <div className="p-6 pb-0 flex flex-col items-center text-center">
                      <div className="size-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 ring-4 ring-red-50 dark:ring-red-900/10 animate-bounce">
                           <span className="material-symbols-outlined text-[32px]">warning</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Alerta de Estoque Crítico</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                          Os seguintes itens atingiram o nível mínimo de segurança (2 ou menos unidades). <br/>
                          <span className="font-medium text-slate-700 dark:text-slate-300">Clique no item para gerenciar.</span>
                      </p>
                  </div>
                  
                  <div className="p-6">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 max-h-[200px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                          {lowStockItems.map(item => (
                              <div 
                                key={item.id} 
                                onClick={() => handleReviewItem(item.id)}
                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-all group"
                                title="Clique para editar este item"
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className="size-8 rounded bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                                          <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{item.name}</span>
                                          <span className="text-xs text-slate-500 truncate">SKU: {item.sku}</span>
                                      </div>
                                  </div>
                                  <div className="pl-2 shrink-0 flex items-center gap-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                                          {item.qty} un.
                                      </span>
                                      <span className="material-symbols-outlined text-[18px] text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                          arrow_forward
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                      <button 
                          onClick={() => setShowLowStockAlert(false)}
                          className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
                      >
                          Fechar Alerta
                      </button>
                  </div>
              </div>
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
                      <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
                          <select 
                            value={activeFilters.category}
                            onChange={(e) => setActiveFilters(prev => ({...prev, category: e.target.value}))}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                          >
                              <option value="all">Todas as Categorias</option>
                              {uniqueCategories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                      </div>
                      <div className="flex flex-col gap-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                          <select 
                            value={activeFilters.status}
                            onChange={(e) => setActiveFilters(prev => ({...prev, status: e.target.value}))}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-primary focus:border-primary"
                          >
                              <option value="all">Todos os Status</option>
                              <option value="available">Disponível</option>
                              <option value="low">Baixo Estoque</option>
                          </select>
                      </div>
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
          <StatCard title="Total em Estoque" value="1,450" change="5%" isPositive={true} icon="inventory" color="blue" />
          <StatCard title="Computadores" value="320" change="2%" isPositive={true} icon="computer" color="purple" />
          <StatCard title="Celulares" value="150" change="1%" isPositive={false} icon="smartphone" color="orange" />
          <StatCard title="Chips & Acess." value="980" change="12%" isPositive={true} icon="sim_card" color="teal" />
        </section>

        {/* Chart Section */}
        <section className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-slate-900 dark:text-white text-lg font-bold">Distribuição por Categoria</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Volume atual comparado ao mês anterior</p>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              <span className="material-symbols-outlined text-[18px]">calendar_today</span>
              Este Mês
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
                  placeholder="Buscar por nome, SKU, categoria ou status..." 
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
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Quantidade</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                     <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right">Ações</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border-light dark:divide-border-dark">
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item, index) => (
                            <TableRow 
                                key={item.id}
                                icon={item.icon} 
                                name={item.name} 
                                desc={item.desc} 
                                sku={item.sku} 
                                category={item.category} 
                                qty={`${item.qty} un.`} 
                                status={item.status} 
                                index={index}
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
                    Mostrando {filteredItems.length} de {items.length} items
                </span>
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors" disabled><span className="material-symbols-outlined">chevron_left</span></button>
                    <button className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
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

const TableRow = ({ icon, name, desc, sku, category, qty, status, index }: any) => (
    <tr 
        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-default animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards"
        style={{ animationDelay: `${index * 50}ms` }}
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
        <td className="p-4 text-sm text-slate-900 dark:text-white font-medium">{qty}</td>
        <td className="p-4">
            <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${status === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                <span className={`text-sm font-medium ${status === 'available' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {status === 'available' ? 'Disponível' : 'Baixo Estoque'}
                </span>
            </div>
        </td>
        <td className="p-4 text-right">
             <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Editar">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
            </div>
        </td>
    </tr>
);

export default Dashboard;