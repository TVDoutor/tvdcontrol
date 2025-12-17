import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Extended Mock Data for Inventory List
const mockInventoryItems = [
  { id: 1, icon: "laptop_mac", name: 'MacBook Pro M1 14"', desc: 'Apple Silicon', sku: 'AST-00124', category: 'Computadores', location: 'Escritório SP - Andar 2', purchaseDate: '15 Dez 2022', status: 'in_use' },
  { id: 2, icon: "smartphone", name: 'iPhone 13 128GB', desc: 'Midnight Blue', sku: 'AST-02399', category: 'Celulares', location: 'Empréstimo (Carlos M.)', purchaseDate: '10 Jan 2023', status: 'in_use' },
  { id: 3, icon: "sim_card", name: 'Vivo SIM 4G/5G', desc: 'Corporativo', sku: 'SIM-9921', category: 'Chips', location: 'Estoque TI', purchaseDate: '05 Mar 2023', status: 'available' },
  { id: 4, icon: "monitor", name: 'Dell UltraSharp 27"', desc: 'U2720Q 4K', sku: 'MON-44211', category: 'Monitores', location: 'Escritório SP - Andar 2', purchaseDate: '20 Out 2022', status: 'available' },
  { id: 5, icon: "keyboard", name: 'Logitech MX Keys', desc: 'Wireless', sku: 'PER-11234', category: 'Periféricos', location: 'Estoque TI', purchaseDate: '01 Fev 2023', status: 'available' },
  { id: 6, icon: "smartphone", name: 'Samsung S23 Ultra', desc: 'Phantom Black', sku: 'AST-02400', category: 'Celulares', location: 'Manutenção', purchaseDate: '15 Jan 2023', status: 'maintenance' },
  { id: 7, icon: "laptop_windows", name: 'Dell XPS 15', desc: 'i9 12th Gen', sku: 'AST-00552', category: 'Computadores', location: 'Estoque TI', purchaseDate: '12 Nov 2022', status: 'available' },
  { id: 8, icon: "headphones", name: 'Sony WH-1000XM4', desc: 'Noise Cancelling', sku: 'ACC-3310', category: 'Acessórios', location: 'Escritório SP - Andar 3', purchaseDate: '05 Dez 2022', status: 'in_use' },
  { id: 9, icon: "tablet_mac", name: 'iPad Pro 11"', desc: 'M2 Chip', sku: 'AST-09912', category: 'Tablets', location: 'Estoque TI', purchaseDate: '22 Abr 2023', status: 'available' },
  { id: 10, icon: "print", name: 'HP LaserJet Pro', desc: 'M404dw', sku: 'PRT-1122', category: 'Impressoras', location: 'Escritório SP - Recepção', purchaseDate: '10 Set 2022', status: 'in_use' },
];

const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(mockInventoryItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
      category: 'all',
      status: 'all'
  });

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Definido como 5 para demonstrar a paginação com os 10 itens de exemplo

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(items.map(i => i.category)));

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = 
            item.name.toLowerCase().includes(lowerQuery) ||
            item.desc.toLowerCase().includes(lowerQuery) ||
            item.sku.toLowerCase().includes(lowerQuery) ||
            item.location.toLowerCase().includes(lowerQuery);

        const matchesCategory = activeFilters.category === 'all' || item.category === activeFilters.category;
        const matchesStatus = activeFilters.status === 'all' || item.status === activeFilters.status;

        return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, activeFilters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  // Handlers
  const handlePageChange = (pageNumber: number) => {
      setCurrentPage(pageNumber);
  };

  const handleNextPage = () => {
      if (currentPage < totalPages) {
          setCurrentPage(prev => prev + 1);
      }
  };

  const handlePrevPage = () => {
      if (currentPage > 1) {
          setCurrentPage(prev => prev - 1);
      }
  };

  // Delete Handlers
  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
      e.stopPropagation();
      setItemToDelete(item);
      setShowDeleteModal(true);
  };

  const confirmDelete = () => {
      if (itemToDelete) {
          setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
          setShowDeleteModal(false);
          setItemToDelete(null);
          
          // Se a página atual ficar vazia após exclusão, voltar uma página
          if (currentItems.length === 1 && currentPage > 1) {
              setCurrentPage(prev => prev - 1);
          }
      }
  };

  // Export Function
  const handleExport = () => {
      alert("Iniciando download do relatório completo de inventário...");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
       
       {/* Modal de Confirmação de Exclusão */}
       {showDeleteModal && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
               <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-in zoom-in-95 duration-200">
                   <div className="p-6 text-center">
                        <div className="size-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                             <span className="material-symbols-outlined text-[28px]">delete</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Item?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                            Você está prestes a excluir <strong>{itemToDelete?.name}</strong>.
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Excluir
                            </button>
                        </div>
                   </div>
               </div>
           </div>
       )}

       <div className="flex-1 flex flex-col max-w-[1400px] w-full mx-auto p-4 md:p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col gap-1">
                    <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Inventário Completo</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Gerencie todos os ativos, localizações e atribuições.</p>
                </div>
                <button 
                    onClick={() => navigate('/items/add')}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-primary/30 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Novo Item</span>
                </button>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined group-focus-within:text-primary transition-colors">search</span>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm transition-all placeholder:text-slate-400" 
                            placeholder="Buscar por nome, SKU ou localização..." 
                            type="text"
                        />
                    </div>
                    <div className="md:col-span-3">
                         <select 
                            value={activeFilters.category}
                            onChange={(e) => setActiveFilters(prev => ({...prev, category: e.target.value}))}
                            className="w-full py-2.5 pl-3 pr-10 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-slate-700 dark:text-white cursor-pointer"
                        >
                            <option value="all">Todas as Categorias</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                         </select>
                    </div>
                     <div className="md:col-span-3">
                         <select 
                            value={activeFilters.status}
                            onChange={(e) => setActiveFilters(prev => ({...prev, status: e.target.value}))}
                            className="w-full py-2.5 pl-3 pr-10 bg-background-light dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm text-slate-700 dark:text-white cursor-pointer"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="available">Disponível</option>
                            <option value="in_use">Em Uso</option>
                            <option value="maintenance">Manutenção</option>
                            <option value="retired">Desativado</option>
                         </select>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Item / Modelo</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden sm:table-cell">Tag / SKU</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden md:table-cell">Categoria</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden lg:table-cell">Localização</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider hidden xl:table-cell">Data Compra</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody 
                            key={`${currentPage}-${searchQuery}-${activeFilters.category}-${activeFilters.status}`}
                            className="divide-y divide-border-light dark:divide-border-dark"
                        >
                            {currentItems.length > 0 ? (
                                currentItems.map((item, index) => (
                                    <tr 
                                        key={item.id}
                                        onClick={() => navigate(`/item/${item.id}`)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group opacity-0 animate-slide-up"
                                        style={{ animationDelay: `${index * 75}ms` }}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg w-10 h-10 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-600">
                                                    <span className="material-symbols-outlined transition-transform group-hover:scale-110">{item.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono hidden sm:table-cell">{item.sku}</td>
                                        <td className="p-4 hidden md:table-cell"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{item.category}</span></td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px] text-slate-400">location_on</span>
                                                {item.location}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400 hidden xl:table-cell">{item.purchaseDate}</td>
                                        <td className="p-4">
                                           <StatusBadge status={item.status} />
                                        </td>
                                        <td className="p-4 text-right">
                                             <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/item/${item.id}`); }}
                                                    className="text-slate-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" 
                                                    title="Ver Detalhes"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        navigate(`/item/${item.id}`, { state: { editMode: true } });
                                                    }}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" 
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteClick(e, item)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" 
                                                    title="Excluir"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[32px] text-slate-400">search_off</span>
                                            </div>
                                            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Nenhum item encontrado</p>
                                            <p className="text-sm">Tente ajustar seus filtros ou termos de busca.</p>
                                            <button 
                                                onClick={() => { setSearchQuery(''); setActiveFilters({category: 'all', status: 'all'}); }}
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
                
                {/* Pagination (Functional) */}
                <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between bg-white dark:bg-surface-dark">
                    <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">
                        Mostrando <span className="font-semibold text-slate-900 dark:text-white">{filteredItems.length === 0 ? 0 : indexOfFirstItem + 1}</span> a <span className="font-semibold text-slate-900 dark:text-white">{Math.min(indexOfLastItem, filteredItems.length)}</span> de <span className="font-semibold text-slate-900 dark:text-white">{filteredItems.length}</span> resultados
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                        <button 
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>
                        
                        <div className="hidden sm:flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        currentPage === page
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'available':
            return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400">
                    <span className="size-1.5 rounded-full bg-green-500"></span>
                    Disponível
                </div>
            );
        case 'in_use':
            return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="size-1.5 rounded-full bg-blue-500"></span>
                    Em Uso
                </div>
            );
        case 'maintenance':
            return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400">
                    <span className="size-1.5 rounded-full bg-orange-500"></span>
                    Manutenção
                </div>
            );
        case 'retired':
            return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                    <span className="size-1.5 rounded-full bg-red-500"></span>
                    Desativado
                </div>
            );
        default:
            return (
                 <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    <span className="size-1.5 rounded-full bg-slate-400"></span>
                    Desconhecido
                </div>
            );
    }
};

export default Inventory;