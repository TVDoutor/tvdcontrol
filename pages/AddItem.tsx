import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const initialFormData = {
    category: '',
    type: '',
    manufacturer: '',
    name: '',
    serialNumber: '',
    assetTag: '',
    status: 'available',
    assignedTo: '',
    purchaseDate: '',
    warrantyEnd: '',
    notes: ''
};

const AddItem: React.FC = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Estado para controlar o dropdown customizado de categoria
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCategoryRendered, setIsCategoryRendered] = useState(false);

  // Mapeamento de categorias e ícones
  const categoryOptions = [
      { value: 'Computadores', label: 'Computadores', icon: 'computer' },
      { value: 'Celulares', label: 'Celulares', icon: 'smartphone' },
      { value: 'Monitores', label: 'Monitores', icon: 'monitor' },
      { value: 'Periféricos', label: 'Periféricos', icon: 'keyboard' },
      { value: 'Chips', label: 'Chips', icon: 'sim_card' },
      { value: 'Acessórios', label: 'Acessórios', icon: 'headphones' },
  ];
  
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState(initialFormData);

  // Estado para armazenar erros de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Effect para lidar com a animação de saída (Exit Animation)
  // Mantém o componente montado por 200ms após o fechamento para permitir o fade-out
  useEffect(() => {
      if (isCategoryOpen) {
          setIsCategoryRendered(true);
      } else {
          const timer = setTimeout(() => setIsCategoryRendered(false), 200);
          return () => clearTimeout(timer);
      }
  }, [isCategoryOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Limpa o erro do campo quando o usuário começa a digitar/selecionar
      if (errors[name]) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
          });
      }
  };

  const handleCategorySelect = (value: string) => {
      setFormData(prev => ({ ...prev, category: value }));
      
      if (errors.category) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.category;
              return newErrors;
          });
      }
      setIsCategoryOpen(false); // Fecha o dropdown automaticamente, disparando a animação
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.category) newErrors.category = "A categoria é obrigatória.";
      if (!formData.type) newErrors.type = "Selecione o tipo do item.";
      if (!formData.name.trim()) newErrors.name = "O nome/modelo é obrigatório.";
      if (!formData.serialNumber.trim()) newErrors.serialNumber = "O número de série é obrigatório.";

      // Validação de Datas
      if (!formData.purchaseDate) newErrors.purchaseDate = "A data de compra é obrigatória.";
      if (!formData.warrantyEnd) newErrors.warrantyEnd = "O fim da garantia é obrigatório.";
      
      if (formData.purchaseDate && formData.warrantyEnd) {
          if (formData.warrantyEnd <= formData.purchaseDate) {
              newErrors.warrantyEnd = "O fim da garantia deve ser posterior à data de compra.";
          }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    // Verifica se há dados preenchidos antes de abrir o modal
    const hasData = formData.name || formData.serialNumber || formData.category || formData.purchaseDate;
    if (hasData) {
        setShowCancelModal(true);
    } else {
        navigate('/dashboard');
    }
  };

  const confirmCancel = () => {
      navigate('/dashboard');
  };

  const handleSave = () => {
    if (!validateForm()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setIsSaving(true);
    // Simula uma chamada de API (Aumentado para 1.5s para ver melhor a animação)
    setTimeout(() => {
        setIsSaving(false);
        setShowSuccess(true); 
        
        // Redireciona automaticamente após 2 segundos
        setTimeout(() => {
             navigate('/item/1');
        }, 2000);
    }, 1500);
  };

  const handleAddAnother = () => {
      setFormData(initialFormData);
      setShowSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDetails = () => {
      navigate('/item/1');
  };

  // Helper para classes de input baseadas em erro
  const getInputClass = (fieldName: string) => {
      const baseClass = "w-full rounded-lg border bg-slate-50 dark:bg-slate-800 text-text-main-light dark:text-white h-12 px-4 focus:ring-2 outline-none transition-all";
      const errorClass = "border-red-500 focus:border-red-500 focus:ring-red-200";
      const normalClass = "border-slate-300 dark:border-slate-700 placeholder:text-text-sub-light dark:placeholder:text-slate-500 focus:ring-primary focus:border-primary";
      
      return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  const getSelectedCategoryIcon = () => {
      return categoryOptions.find(c => c.value === formData.category)?.icon || 'inventory_2';
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark p-6 relative">
       
       {/* Modal de Confirmação de Cancelamento */}
       {showCancelModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-slide-up">
                   <div className="p-6 text-center">
                        <div className="size-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                             <span className="material-symbols-outlined text-[28px]">warning</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Descartar alterações?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Você possui dados não salvos neste formulário. Se sair agora, todas as informações serão perdidas.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Continuar Editando
                            </button>
                            <button 
                                onClick={confirmCancel}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Sim, Descartar
                            </button>
                        </div>
                   </div>
               </div>
           </div>
       )}

       {/* Modal de Sucesso */}
       {showSuccess && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-slide-up">
                   
                   {/* Header do Modal */}
                   <div className="flex flex-col items-center justify-center p-8 pb-6 text-center bg-white dark:bg-surface-dark relative">
                        <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/10 animate-bounce">
                             <span className="material-symbols-outlined text-[32px]">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Item Registrado!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">O novo ativo foi adicionado ao inventário.</p>
                        
                        {/* Barra de Progresso de Redirecionamento */}
                        <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-[width_2s_linear_forwards] w-0"></div>
                   </div>

                   {/* Resumo do Item */}
                   <div className="px-8 pb-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 text-primary">
                                        <span className="material-symbols-outlined text-[20px]">{getSelectedCategoryIcon()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Categoria</span>
                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.category}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">Nome / Modelo</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block" title={formData.name}>{formData.name}</span>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-400 block mb-0.5">Fabricante</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">{formData.manufacturer || '-'}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-slate-400 mt-4 italic">Redirecionando para detalhes do item...</p>
                   </div>

                   {/* Ações do Modal */}
                   <div className="p-6 pt-0 flex flex-col gap-3">
                        <button 
                            onClick={handleGoToDetails}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-sm shadow-primary/30 transition-all flex items-center justify-center gap-2"
                        >
                            Ver Detalhes Agora
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                        
                        <button 
                            onClick={handleAddAnother}
                            className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium transition-colors"
                        >
                            Cancelar Redirecionamento e Adicionar Outro
                        </button>
                   </div>
               </div>
           </div>
       )}

       {/* Overlay invisível para fechar dropdown */}
       {isCategoryOpen && (
           <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)}></div>
       )}

       <div className="layout-content-container flex flex-col max-w-[960px] flex-1 mx-auto w-full">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 pt-2 mb-4 animate-fade-in">
                <Link to="/dashboard" className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors">Dashboard</Link>
                <span className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal">/</span>
                <Link to="/dashboard" className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors">Inventário</Link>
                <span className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal">/</span>
                <span className="text-text-main-light dark:text-white text-sm font-medium leading-normal">Adicionar Novo</span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-wrap justify-between gap-3 mb-8 animate-slide-up opacity-0" style={{animationDelay: '100ms'}}>
                <div className="flex min-w-72 flex-col gap-2">
                    <h1 className="text-text-main-light dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Adicionar Novo Item</h1>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-base font-normal leading-normal">Preencha os detalhes abaixo para registrar um novo ativo no sistema.</p>
                </div>
            </div>

            {/* Main Form Card */}
            <form className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden mb-12 animate-slide-up opacity-0" style={{animationDelay: '200ms'}}>
                {/* Section: Product Info */}
                <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                        Informações do Produto
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Categoria - Custom Dropdown com Ícones e Animação */}
                        <label className="flex flex-col flex-1 relative animate-slide-up opacity-0" style={{animationDelay: '300ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Categoria <span className="text-red-500">*</span>
                            </p>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                                    aria-haspopup="listbox"
                                    aria-expanded={isCategoryOpen}
                                    className={`${getInputClass('category')} text-left flex items-center justify-between cursor-pointer`}
                                >
                                    {formData.category ? (
                                        <span className="flex items-center gap-2 text-text-main-light dark:text-white font-medium">
                                            <span className="material-symbols-outlined text-primary text-[20px]">
                                                {categoryOptions.find(c => c.value === formData.category)?.icon}
                                            </span>
                                            {formData.category}
                                        </span>
                                    ) : (
                                        <span className="text-text-sub-light dark:text-slate-500">Selecione a categoria</span>
                                    )}
                                    <span className={`material-symbols-outlined text-text-sub-light transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                
                                {isCategoryRendered && (
                                    <div 
                                        className={`absolute top-full left-0 w-full mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto transition-all duration-200 origin-top ${
                                            isCategoryOpen 
                                            ? 'opacity-100 translate-y-0 scale-100' 
                                            : 'opacity-0 -translate-y-2 scale-95'
                                        }`}
                                        role="listbox"
                                    >
                                        {categoryOptions.map((option) => (
                                            <div 
                                                key={option.value}
                                                onClick={() => handleCategorySelect(option.value)}
                                                role="option"
                                                aria-selected={formData.category === option.value}
                                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${
                                                    formData.category === option.value 
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-primary' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                <span className={`material-symbols-outlined text-[20px] ${formData.category === option.value ? 'text-primary' : 'text-slate-400'}`}>
                                                    {option.icon}
                                                </span>
                                                <span className="font-medium">{option.label}</span>
                                                {formData.category === option.value && (
                                                    <span className="material-symbols-outlined text-primary text-[18px] ml-auto">check</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.category && <p className="text-red-500 text-xs mt-1 font-medium">{errors.category}</p>}
                        </label>

                        {/* Tipo de Item */}
                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '350ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Tipo de Item <span className="text-red-500">*</span>
                            </p>
                            <div className="relative">
                                <select 
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className={`${getInputClass('type')} appearance-none`}
                                >
                                    <option disabled value="">Selecione o tipo</option>
                                    <option value="smartphone">Smartphone</option>
                                    <option value="notebook">Notebook</option>
                                    <option value="monitor">Monitor</option>
                                    <option value="peripheral">Periférico</option>
                                    <option value="chip">Chip / SIM Card</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub-light">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                            {errors.type && <p className="text-red-500 text-xs mt-1 font-medium">{errors.type}</p>}
                        </label>

                        {/* Fabricante */}
                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '400ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Fabricante</p>
                            <input 
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleChange}
                                className={getInputClass('manufacturer')} 
                                placeholder="Ex: Dell, Apple, Samsung" 
                                type="text"
                            />
                        </label>

                         {/* Tag de Patrimônio (Movido para cá para equilibrar o grid) */}
                         <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '450ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Tag de Patrimônio</p>
                            <div className="relative">
                                <input 
                                    name="assetTag"
                                    value={formData.assetTag}
                                    onChange={handleChange}
                                    className={`${getInputClass('assetTag')} pl-12 font-mono`} 
                                    placeholder="#000000" 
                                    type="text"
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-sub-light">
                                    <span className="material-symbols-outlined text-[20px]">label</span>
                                </div>
                            </div>
                        </label>

                        {/* Nome / Modelo */}
                        <label className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{animationDelay: '500ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Nome / Modelo do Item <span className="text-red-500">*</span>
                            </p>
                            <input 
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={getInputClass('name')} 
                                placeholder="Ex: MacBook Pro M2 14-inch" 
                                type="text"
                            />
                             {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                        </label>

                        {/* Número de Série */}
                        <label className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{animationDelay: '550ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Número de Série <span className="text-red-500">*</span>
                            </p>
                            <div className="relative">
                                <input 
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    className={`${getInputClass('serialNumber')} pl-12 font-mono`} 
                                    placeholder="S/N" 
                                    type="text"
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-sub-light">
                                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                                </div>
                            </div>
                            {errors.serialNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.serialNumber}</p>}
                        </label>
                    </div>
                </div>

                {/* Section: Status */}
                <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark bg-[#f8f9fc] dark:bg-[#15202b]">
                    <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">assignment_ind</span>
                        Status e Atribuição
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '600ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Status Atual</p>
                            <div className="relative">
                                <select 
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`${getInputClass('status')} bg-white dark:bg-slate-800 appearance-none`}
                                >
                                    <option className="text-green-600" value="available">Disponível</option>
                                    <option className="text-blue-600" value="in_use">Em Uso</option>
                                    <option className="text-orange-600" value="maintenance">Em Manutenção</option>
                                    <option className="text-red-600" value="retired">Desativado</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub-light">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                        </label>
                         <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '650ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Atribuir a Usuário</p>
                            <div className="relative">
                                <select 
                                    name="assignedTo"
                                    value={formData.assignedTo}
                                    onChange={handleChange}
                                    className={`${getInputClass('assignedTo')} bg-white dark:bg-slate-800 appearance-none`}
                                >
                                    <option value="">Nenhum (Manter em estoque)</option>
                                    <option value="1">Ana Silva - Criação</option>
                                    <option value="2">Carlos Souza - TI</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-sub-light">
                                    <span className="material-symbols-outlined text-[18px]">person_search</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Section: Financial & Warranty */}
                <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">attach_money</span>
                        Financeiro e Garantia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '700ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Data da Compra <span className="text-red-500">*</span>
                            </p>
                            <input 
                                name="purchaseDate"
                                type="date"
                                value={formData.purchaseDate}
                                onChange={handleChange}
                                className={getInputClass('purchaseDate')} 
                            />
                            {errors.purchaseDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.purchaseDate}</p>}
                        </label>

                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '750ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                                Fim da Garantia <span className="text-red-500">*</span>
                            </p>
                            <input 
                                name="warrantyEnd"
                                type="date"
                                value={formData.warrantyEnd}
                                onChange={handleChange}
                                className={getInputClass('warrantyEnd')} 
                            />
                            {errors.warrantyEnd && <p className="text-red-500 text-xs mt-1 font-medium">{errors.warrantyEnd}</p>}
                        </label>
                    </div>
                </div>

                {/* Section: Additional Details (Notes) */}
                <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
                    <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">description</span>
                        Detalhes Adicionais
                    </h3>
                    <div className="flex flex-col gap-6">
                        <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{animationDelay: '800ms'}}>
                            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Observação</p>
                            <textarea 
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-text-main-light dark:text-white p-4 placeholder:text-text-sub-light dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
                                placeholder="Adicione detalhes sobre a condição física, acessórios incluídos, etc." 
                                rows={4}
                            ></textarea>
                        </label>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 p-4 md:p-8 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark animate-slide-up opacity-0" style={{animationDelay: '850ms'}}>
                    <button 
                        onClick={handleCancel}
                        className="px-6 py-3 rounded-lg text-sm font-medium text-text-sub-light dark:text-slate-300 hover:bg-[#e7edf3] dark:hover:bg-slate-700 transition-colors" 
                        type="button"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-primary hover:bg-blue-600 shadow-md transition-all ${isSaving ? 'opacity-80 cursor-wait pl-4 pr-6' : ''}`} 
                        type="button"
                        style={{ minWidth: '140px' }}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processando...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[18px]">save</span>
                                <span>Salvar Item</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
       </div>
    </div>
  );
};

export default AddItem;