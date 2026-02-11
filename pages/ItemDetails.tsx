import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useInventoryStore } from '../store/InventoryStore';
import { useUsersStore } from '../store/UsersStore';
import { getCategoriesService } from '../services/categoriesService';

function parseLocalDate(dateText: string): Date | null {
    if (!dateText) return null;
    const parts = dateText.split('-').map((p) => parseInt(p, 10));
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [year, month, day] = parts;
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function formatAsDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

const ItemDetails: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const itemId = params.id ? String(params.id) : '';
    const { getById, updateItem, loadHistory, historyById, assignItem, returnItem } = useInventoryStore();
    const { users } = useUsersStore();
    const [isEditing, setIsEditing] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedAssignUserId, setSelectedAssignUserId] = useState('');
    const [dbCategories, setDbCategories] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Check if we navigated here with the intention to edit
    useEffect(() => {
        const state = location.state as { editMode?: boolean };
        if (state?.editMode) {
            setIsEditing(true);
        }
    }, [location]);

    const item = itemId ? getById(itemId) : undefined;
    const historyEvents = itemId ? historyById[itemId] : undefined;
    const assignedUser = item?.assignedTo ? users.find((u) => u.id === item.assignedTo) : undefined;

    useEffect(() => {
        if (itemId) {
            void loadHistory(itemId);
        }
    }, [itemId, loadHistory]);

    useEffect(() => {
        const service = getCategoriesService();
        void (async () => {
            try {
                const categories = await service.list();
                setDbCategories(categories.map((c) => c.name));
            } catch {
                setDbCategories([]);
            }
        })();
    }, []);

    // Estado do formulário
    const [formData, setFormData] = useState({
        manufacturer: '',
        model: '',
        category: '',
        location: '',
        price: '',
        purchaseDate: '',
        warrantyEnd: '',
        description: ''
    });

    // Helper to convert ISO date to yyyy-MM-dd format for date inputs
    const toDateInputFormat = (isoDate: string | undefined) => {
        if (!isoDate) return '';
        // Extract just the date part (YYYY-MM-DD) from ISO string
        return isoDate.split('T')[0];
    };

    useEffect(() => {
        if (!item) return;
        const purchaseDate = toDateInputFormat(item.purchaseDate);
        const defaultWarrantyEnd = purchaseDate ? formatAsDateInput(addMonths(parseLocalDate(purchaseDate) as Date, 12)) : '';
        setFormData({
            manufacturer: item.manufacturer || '',
            model: item.model || '',
            category: item.category || '',
            location: item.location || '',
            price: item.purchasePrice ? `R$ ${item.purchasePrice.toLocaleString('pt-BR')}` : '',
            purchaseDate,
            warrantyEnd: toDateInputFormat(item.warrantyEnd) || defaultWarrantyEnd,
            description: item.specs || item.notes || '',
        });
    }, [item?.id]);

    const purchaseDateObj = parseLocalDate(formData.purchaseDate);
    const computedWarrantyEnd = purchaseDateObj ? addMonths(purchaseDateObj, 12) : null;
    const effectiveWarrantyEnd = parseLocalDate(formData.warrantyEnd) || computedWarrantyEnd;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const warrantyDaysRemaining = effectiveWarrantyEnd
        ? Math.ceil((effectiveWarrantyEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
    const warrantyTextClass = warrantyDaysRemaining === null
        ? 'text-slate-900 dark:text-white'
        : warrantyDaysRemaining > 30
            ? 'text-emerald-600 dark:text-emerald-400'
            : warrantyDaysRemaining >= 1
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-red-600 dark:text-red-400';
    const warrantyRemainingText = warrantyDaysRemaining === null
        ? 'Sem data de garantia'
        : warrantyDaysRemaining > 0
            ? `Restam ${warrantyDaysRemaining} dia(s)`
            : warrantyDaysRemaining === 0
                ? 'Garantia vence hoje'
                : `Garantia vencida há ${Math.abs(warrantyDaysRemaining)} dia(s)`;

    const formatDateDisplay = (isoDate: string) => {
        if (!isoDate) return '-';
        try {
            const [year, month, day] = isoDate.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
        } catch (e) {
            return isoDate;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Formatação especial para o campo de preço
        if (name === 'price') {
            // Remove todos os caracteres exceto dígitos
            const numbers = value.replace(/\D/g, '');

            // Converte para número e formata em Real
            if (numbers === '') {
                setFormData(prev => ({ ...prev, [name]: '' }));
            } else {
                const numberValue = parseInt(numbers) / 100;
                const formatted = numberValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                setFormData(prev => ({ ...prev, [name]: formatted }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Limpa erros ao editar
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSave = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.purchaseDate) newErrors.purchaseDate = "Data de compra é obrigatória";
        if (!formData.warrantyEnd) newErrors.warrantyEnd = "Fim da garantia é obrigatório";

        if (formData.purchaseDate && formData.warrantyEnd) {
            if (formData.warrantyEnd <= formData.purchaseDate) {
                newErrors.warrantyEnd = "A garantia deve terminar após a data de compra";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!item) return;

        const priceNumber = formData.price
            ? Number(String(formData.price).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.'))
            : undefined;

        void updateItem({
            id: item.id,
            manufacturer: formData.manufacturer,
            model: formData.model,
            category: formData.category,
            location: formData.location,
            purchaseDate: formData.purchaseDate,
            warrantyEnd: formData.warrantyEnd,
            purchasePrice: Number.isFinite(priceNumber as number) ? (priceNumber as number) : undefined,
            specs: formData.description,
        });

        setIsEditing(false);
    };

    const handleReturnItem = () => {
        if (!item || !item.assignedTo) return;
        void returnItem(item.id);
    };

    const handleAssignItem = (targetUserId?: string) => {
        if (!item) return;
        const target = targetUserId ? users.find((u) => u.id === targetUserId) : undefined;
        if (!target) return;
        void assignItem(item.id, target.id);
    };

    const assignableUsers = users.filter((u) => u.status === 'active');
    const categoryOptions = Array.from(
        new Set([
            ...dbCategories,
            formData.category,
        ].filter(Boolean))
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark p-6 relative">
            {!item && (
                <div className="max-w-[1200px] mx-auto w-full">
                    <div className="rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark p-6">
                        <p className="text-slate-700 dark:text-slate-300 text-sm">
                            Item não encontrado (ID: {itemId || '-'})
                        </p>
                        <button
                            onClick={() => navigate('/inventory')}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            Voltar ao Inventário
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Histórico */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico Completo</h3>
                            <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-8">
                                {(historyEvents || []).map((event) => (
                                    <TimelineEvent key={event.id} {...event} />
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                            <button onClick={() => setShowHistory(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Atribuição */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowAssignModal(false)}>
                    <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Atribuir Usuário</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto">
                            {assignableUsers.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum usuário ativo disponível para atribuição.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {assignableUsers.map((u) => (
                                        <label
                                            key={u.id}
                                            className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                                                selectedAssignUserId === u.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="assign-user"
                                                checked={selectedAssignUserId === u.id}
                                                onChange={() => setSelectedAssignUserId(u.id)}
                                                className="w-4 h-4"
                                            />
                                            <div className="size-9 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 shrink-0" style={{ backgroundImage: `url('${u.avatar}')` }}></div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.name}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedAssignUserId) return;
                                    handleAssignItem(selectedAssignUserId);
                                    setShowAssignModal(false);
                                    setSelectedAssignUserId('');
                                }}
                                disabled={!selectedAssignUserId}
                                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm text-sm font-bold"
                            >
                                Confirmar Atribuição
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col w-full max-w-[1200px] mx-auto gap-6">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link to="/dashboard" className="text-slate-500 hover:text-primary transition-colors">Inventário</Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-500">Laptops</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-900 dark:text-white font-medium">MacBook Pro 16</span>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-1 w-full md:w-auto">
                        <div className="flex items-center gap-3 flex-wrap">
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    className="text-2xl md:text-3xl font-bold tracking-tight bg-transparent border-b-2 border-primary text-slate-900 dark:text-white focus:outline-none min-w-[300px]"
                                />
                            ) : (
                                <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">{formData.model}</h1>
                            )}

                            {assignedUser ? (
                                <div className="flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-bold uppercase tracking-wider">Em Uso</div>
                            ) : (
                                <div className="flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 text-xs font-bold uppercase tracking-wider">Disponível</div>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Número de Série: <span className="font-mono text-slate-700 dark:text-slate-300">{item?.serialNumber || '-'}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 self-end md:self-auto">
                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            <span className="material-symbols-outlined text-[18px]">history</span>
                            Histórico
                        </button>

                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-sm font-bold transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm text-sm font-bold"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    Salvar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm text-sm font-bold"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                Editar Item
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* General Info */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Informações Gerais</h3>
                                {isEditing && <span className="text-xs text-primary font-bold uppercase tracking-wide animate-pulse">Editando</span>}
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                                    <InfoField
                                        label="Fabricante"
                                        value={formData.manufacturer}
                                        name="manufacturer"
                                        icon="verified"
                                        isEditing={isEditing}
                                        onChange={handleInputChange}
                                    />
                                    <InfoField
                                        label="Modelo"
                                        value={formData.model}
                                        name="model"
                                        icon="laptop_mac"
                                        isEditing={isEditing}
                                        onChange={handleInputChange}
                                    />
                                    <div className="flex flex-col gap-1 w-full">
                                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoria</span>
                                        <div className="flex items-center gap-2 h-8">
                                            <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">category</span>
                                            {isEditing ? (
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                    className="flex-1 min-w-0 bg-transparent border-b border-primary/50 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-primary py-0.5 transition-colors"
                                                >
                                                    {categoryOptions.map((category) => (
                                                        <option key={category} value={category}>
                                                            {category}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-slate-900 dark:text-white font-medium truncate">{formData.category}</p>
                                            )}
                                        </div>
                                    </div>
                                    <InfoField
                                        label="Localização Física"
                                        value={formData.location}
                                        name="location"
                                        icon="location_on"
                                        isEditing={isEditing}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Detalhes da Compra e Garantia</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <span className="text-xs font-medium text-slate-500 uppercase">Preço de Compra</span>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="price"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                placeholder="R$ 0,00"
                                                className="w-full mt-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none"
                                            />
                                        ) : (
                                            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formData.price}</p>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <span className="text-xs font-medium text-slate-500 uppercase">
                                            Data da Compra {isEditing && <span className="text-red-500">*</span>}
                                        </span>
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="date"
                                                    name="purchaseDate"
                                                    value={formData.purchaseDate}
                                                    onChange={handleInputChange}
                                                    className={`w-full mt-1 bg-white dark:bg-slate-900 border ${errors.purchaseDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded px-2 py-1 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none`}
                                                />
                                                {errors.purchaseDate && <p className="text-xs text-red-500 mt-1">{errors.purchaseDate}</p>}
                                            </>
                                        ) : (
                                            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{formatDateDisplay(formData.purchaseDate)}</p>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <span className="text-xs font-medium text-slate-500 uppercase">
                                            Fim da Garantia {isEditing && <span className="text-red-500">*</span>}
                                        </span>
                                        {isEditing ? (
                                            <>
                                                <input
                                                    type="date"
                                                    name="warrantyEnd"
                                                    value={formData.warrantyEnd}
                                                    onChange={handleInputChange}
                                                    className={`w-full mt-1 bg-white dark:bg-slate-900 border ${errors.warrantyEnd ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded px-2 py-1 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary outline-none`}
                                                />
                                                {errors.warrantyEnd && <p className="text-xs text-red-500 mt-1">{errors.warrantyEnd}</p>}
                                            </>
                                        ) : (
                                            <p className={`text-lg font-bold mt-1 ${warrantyTextClass}`}>
                                                {formatDateDisplay(formData.warrantyEnd || (effectiveWarrantyEnd ? formatAsDateInput(effectiveWarrantyEnd) : ''))}
                                            </p>
                                        )}
                                        {!isEditing && <span className="text-xs text-slate-400">{warrantyRemainingText}</span>}
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Especificações Técnicas</h4>
                                    {isEditing ? (
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                                        />
                                    ) : (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {formData.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="flex flex-col gap-6">
                        {/* Assignment */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-primary/5">
                                <h3 className="text-base font-semibold text-primary">{assignedUser ? 'Atribuído a' : 'Atribuição'}</h3>
                                <span className="material-symbols-outlined text-primary">person</span>
                            </div>
                            <div className="p-6 flex flex-col items-center text-center">
                                {assignedUser ? (
                                    <>
                                        <div className="relative mb-4">
                                            <div className="size-20 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-800 shadow-md" style={{ backgroundImage: `url('${assignedUser.avatar}')` }}></div>
                                            <div className="absolute bottom-0 right-0 size-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full"></div>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{assignedUser.name}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{assignedUser.role}</p>
                                        <p className="text-xs text-slate-400 mt-1">{assignedUser.department}</p>
                                        <div className="w-full mt-6 flex gap-3">
                                            <button onClick={() => navigate('/users')} className="flex-1 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Ver Perfil</button>
                                            <button
                                                onClick={handleReturnItem}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                                                Devolver Item
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center py-2">
                                        <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                                            <span className="material-symbols-outlined text-3xl">person_off</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Não Atribuído</h4>
                                        <p className="text-sm text-slate-500 mb-6 max-w-[200px]">Este item está disponível no estoque.</p>
                                        <button onClick={() => setShowAssignModal(true)} className="w-full py-2.5 px-4 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                                            Atribuir Usuário
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Atividade Recente</h3>
                            </div>
                            <div className="p-6">
                                <div className="relative border-l border-slate-200 dark:border-slate-700 ml-3 space-y-6">
                                    {(historyEvents || []).slice(0, 3).map((event) => (
                                        <TimelineEvent key={event.id} {...event} />
                                    ))}
                                </div>
                                <button onClick={() => setShowHistory(true)} className="w-full mt-6 py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wide">Ver Histórico Completo</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoField = ({ label, value, icon, isEditing, name, onChange }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2 h-8">
            <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">{icon}</span>
            {isEditing && name ? (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="flex-1 min-w-0 bg-transparent border-b border-primary/50 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-primary py-0.5 transition-colors"
                />
            ) : (
                <p className="text-slate-900 dark:text-white font-medium truncate">{value}</p>
            )}
        </div>
    </div>
);

const TimelineEvent = ({ color, date, title, desc }: any) => {
    // Determine color class based on the 'color' prop
    let bgClass = 'bg-slate-300 dark:bg-slate-600';
    if (color === 'primary') bgClass = 'bg-primary';
    if (color === 'success') bgClass = 'bg-emerald-500';
    if (color === 'danger') bgClass = 'bg-red-500';

    return (
        <div className="relative pl-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-white dark:ring-surface-dark ${bgClass}`}></div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">{date}</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
            <p className="text-xs text-slate-500 mt-1">{desc}</p>
        </div>
    );
};

export default ItemDetails;
