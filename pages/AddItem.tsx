import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store/InventoryStore';
import { useUsersStore } from '../store/UsersStore';
import { getFriendlyErrorMessage } from '../services/httpClient';
import AddItemCancelModal from './addItem/components/AddItemCancelModal';
import AddItemForm from './addItem/components/AddItemForm';
import AddItemSuccessModal from './addItem/components/AddItemSuccessModal';
import { CATEGORY_OPTIONS, INITIAL_FORM_DATA, getCategoryIcon, type AddItemFormData } from './addItem/constants';

const AddItem: React.FC = () => {
  const navigate = useNavigate();
  const { createItem } = useInventoryStore();
  const { users } = useUsersStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddItemFormData>(INITIAL_FORM_DATA);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }) as AddItemFormData);
      
      if (errors[name]) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[name];
              return newErrors;
          });
      }
  };

  const handleCategorySelect = (value: string) => {
      setFormData((prev) => ({ ...prev, category: value }));
      
      if (errors.category) {
          setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.category;
              return newErrors;
          });
      }
  };

  const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.category) newErrors.category = "A categoria é obrigatória.";
      if (!formData.type) newErrors.type = "Selecione o tipo do item.";
      if (!formData.name.trim()) newErrors.name = "O nome/modelo é obrigatório.";
      if (!formData.serialNumber.trim()) newErrors.serialNumber = "O número de série é obrigatório.";

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
    void (async () => {
      try {
        const created = await createItem({
          icon: getCategoryIcon(formData.category),
          name: formData.name,
          sku: formData.assetTag || undefined,
          serialNumber: formData.serialNumber,
          model: formData.name,
          manufacturer: formData.manufacturer || '',
          category: formData.category,
          status: formData.status,
          assignedTo: formData.assignedTo || undefined,
          purchaseDate: formData.purchaseDate,
          warrantyEnd: formData.warrantyEnd,
          notes: formData.notes || '',
        });
        setCreatedId(created.id);
        setIsSaving(false);
        setShowSuccess(true);
        setTimeout(() => {
          navigate(`/item/${created.id}`);
        }, 2000);
      } catch (e) {
        setIsSaving(false);
        alert(getFriendlyErrorMessage(e, 'general'));
      }
    })();
  };

  const handleAddAnother = () => {
      setFormData(INITIAL_FORM_DATA);
      setShowSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToDetails = () => {
      if (createdId) {
        navigate(`/item/${createdId}`);
      }
  };

  const getInputClass = (fieldName: string) => {
      const baseClass = "w-full rounded-lg border bg-slate-50 dark:bg-slate-800 text-text-main-light dark:text-white h-12 px-4 focus:ring-2 outline-none transition-all";
      const errorClass = "border-red-500 focus:border-red-500 focus:ring-red-200";
      const normalClass = "border-slate-300 dark:border-slate-700 placeholder:text-text-sub-light dark:placeholder:text-slate-500 focus:ring-primary focus:border-primary";
      
      return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto bg-background-light dark:bg-background-dark p-6 relative">
      {showCancelModal && <AddItemCancelModal onClose={() => setShowCancelModal(false)} onConfirm={confirmCancel} />}

      {showSuccess && (
        <AddItemSuccessModal
          formData={formData}
          categoryIcon={getCategoryIcon(formData.category)}
          onGoToDetails={handleGoToDetails}
          onAddAnother={handleAddAnother}
        />
      )}

      <div className="layout-content-container flex flex-col max-w-[960px] flex-1 mx-auto w-full">
        <div className="flex flex-wrap gap-2 pt-2 mb-4 animate-fade-in">
          <Link
            to="/dashboard"
            className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal">/</span>
          <Link
            to="/dashboard"
            className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal hover:text-primary transition-colors"
          >
            Inventário
          </Link>
          <span className="text-text-sub-light dark:text-text-sub-dark text-sm font-medium leading-normal">/</span>
          <span className="text-text-main-light dark:text-white text-sm font-medium leading-normal">Adicionar Novo</span>
        </div>

        <div className="flex flex-wrap justify-between gap-3 mb-8 animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
          <div className="flex min-w-72 flex-col gap-2">
            <h1 className="text-text-main-light dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              Adicionar Novo Item
            </h1>
            <p className="text-text-sub-light dark:text-text-sub-dark text-base font-normal leading-normal">
              Preencha os detalhes abaixo para registrar um novo ativo no sistema.
            </p>
          </div>
        </div>

        <AddItemForm
          categoryOptions={CATEGORY_OPTIONS}
          assignableUsers={users.filter((u) => u.status === 'active')}
          formData={formData}
          errors={errors}
          isSaving={isSaving}
          getInputClass={getInputClass}
          onChange={handleChange}
          onCategorySelect={handleCategorySelect}
          onCancel={handleCancel}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default AddItem;
