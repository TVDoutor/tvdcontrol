import React from 'react';
import type { User } from '../../../types';
import type { AddItemFormData, CategoryOption } from '../constants';
import { DropdownField } from '../../../components/Dropdown';
import PhotoUpload from '../../../components/PhotoUpload';

interface AddItemFormProps {
  categoryOptions: CategoryOption[];
  assignableUsers: User[];
  formData: AddItemFormData;
  errors: Record<string, string>;
  isSaving: boolean;
  getInputClass: (fieldName: string) => string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onPhotoChange: (photoMain: string) => void;
  onCategorySelect: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({
  categoryOptions,
  assignableUsers,
  formData,
  errors,
  isSaving,
  getInputClass,
  onChange,
  onPhotoChange,
  onCategorySelect,
  onCancel,
  onSave,
}) => {
  const emitChange = (name: string, value: string) => {
    onChange({ target: { name, value } } as any);
  };

  const normalizedCategory = (formData.category || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const typeOptions =
    normalizedCategory === 'perifericos' || normalizedCategory === 'periferico'
      ? [
          { value: 'mouse', label: 'Mouse', icon: 'mouse' },
          { value: 'keyboard', label: 'Teclado', icon: 'keyboard' },
          { value: 'headset', label: 'Headset', icon: 'headphones' },
          { value: 'other', label: 'Outros', icon: 'category' },
        ]
      : [
          { value: 'smartphone', label: 'Smartphone', icon: 'smartphone' },
          { value: 'notebook', label: 'Notebook', icon: 'laptop_mac' },
          { value: 'monitor', label: 'Monitor', icon: 'tv' },
          { value: 'peripheral', label: 'Periférico', icon: 'devices_other' },
          { value: 'chip', label: 'Chip / SIM Card', icon: 'sim_card' },
        ];

  return (
    <form
      className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden mb-12 animate-slide-up opacity-0"
      style={{ animationDelay: '200ms' }}
    >
      <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
        <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">inventory_2</span>
          Informações do Produto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropdownField
            label="Categoria"
            required
            value={formData.category}
            placeholder="Selecione a categoria"
            options={categoryOptions}
            error={errors.category}
            wrapperClassName="flex flex-col flex-1 relative animate-slide-up opacity-0"
            wrapperStyle={{ animationDelay: '300ms' }}
            buttonClassName={`${getInputClass('category')} text-left flex items-center justify-between cursor-pointer`}
            onValueChange={onCategorySelect}
          />
          <DropdownField
            label="Tipo de Item"
            required
            value={formData.type}
            placeholder="Selecione o tipo"
            options={typeOptions}
            error={errors.type}
            wrapperClassName="flex flex-col flex-1 animate-slide-up opacity-0"
            wrapperStyle={{ animationDelay: '350ms' }}
            buttonClassName={`${getInputClass('type')} text-left flex items-center justify-between cursor-pointer`}
            onValueChange={(v) => emitChange('type', v)}
          />
          <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{ animationDelay: '400ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Fabricante</p>
            <input
              name="manufacturer"
              value={formData.manufacturer}
              onChange={onChange}
              className={getInputClass('manufacturer')}
              placeholder="Ex: Dell, Apple, Samsung"
              type="text"
            />
          </label>
          <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{ animationDelay: '450ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Tag de Patrimônio</p>
            <div className="relative">
              <input
                name="assetTag"
                value={formData.assetTag}
                className={`${getInputClass('assetTag')} pl-12 font-mono`}
                placeholder="#000000"
                type="text"
                readOnly
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-sub-light">
                <span className="material-symbols-outlined text-[20px]">label</span>
              </div>
            </div>
            <p className="text-xs text-text-sub-light dark:text-slate-400 mt-1">Gerada automaticamente pelo sistema.</p>
          </label>
          <label className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{ animationDelay: '500ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
              Nome / Modelo do Item <span className="text-red-500">*</span>
            </p>
            <input
              name="name"
              value={formData.name}
              onChange={onChange}
              className={getInputClass('name')}
              placeholder="Ex: MacBook Pro M2 14-inch"
              type="text"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
          </label>
          <label className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{ animationDelay: '550ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
              Número de Série <span className="text-red-500">*</span>
            </p>
            <div className="relative">
              <input
                name="serialNumber"
                value={formData.serialNumber}
                onChange={onChange}
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
          {normalizedCategory === 'celulares' && formData.type === 'smartphone' && (
            <label className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{ animationDelay: '555ms' }}>
              <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
                Número do Telefone (DDD + 9 dígitos)
              </p>
              <div className="relative">
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={onChange}
                  className={`${getInputClass('phoneNumber')} pl-12`}
                  placeholder="Ex: 11 98346-3999"
                  type="text"
                  inputMode="tel"
                />
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-text-sub-light">
                  <span className="material-symbols-outlined text-[20px]">phone_android</span>
                </div>
              </div>
              {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phoneNumber}</p>}
            </label>
          )}
          <div className="flex flex-col flex-1 md:col-span-2 animate-slide-up opacity-0" style={{ animationDelay: '560ms' }}>
            <PhotoUpload
              value={formData.photoMain}
              onChange={onPhotoChange}
              label="Foto do equipamento"
              placeholder="Clique para adicionar foto do equipamento"
              helperText="Opcional. Registre o estado do equipamento no momento do cadastro."
            />
          </div>
        </div>
      </div>
      <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark bg-[#f8f9fc] dark:bg-[#15202b]">
        <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">assignment_ind</span>
          Status e Atribuição
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DropdownField
            label="Status Atual"
            value={formData.status}
            options={[
              { value: 'available', label: 'Disponível', icon: 'check_circle' },
              { value: 'in_use', label: 'Em Uso', icon: 'devices' },
              { value: 'maintenance', label: 'Em Manutenção', icon: 'build' },
              { value: 'retired', label: 'Desativado', icon: 'block' },
            ]}
            wrapperClassName="flex flex-col flex-1 animate-slide-up opacity-0"
            wrapperStyle={{ animationDelay: '600ms' }}
            buttonClassName={`${getInputClass('status')} text-left flex items-center justify-between cursor-pointer`}
            onValueChange={(v) => emitChange('status', v)}
          />
          <DropdownField
            label="Atribuir a Usuário"
            value={formData.assignedTo}
            placeholder="Nenhum (Manter em estoque)"
            options={[
              { value: '', label: 'Nenhum (Manter em estoque)', icon: 'inventory_2' },
              ...assignableUsers.map((u) => ({ value: u.id, label: `${u.name} - ${u.department}`, icon: 'person' })),
            ]}
            wrapperClassName="flex flex-col flex-1 animate-slide-up opacity-0"
            wrapperStyle={{ animationDelay: '650ms' }}
            buttonClassName={`${getInputClass('assignedTo')} text-left flex items-center justify-between cursor-pointer`}
            onValueChange={(v) => emitChange('assignedTo', v)}
          />
        </div>
      </div>
      <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
        <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">attach_money</span>
          Financeiro e Garantia
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{ animationDelay: '700ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
              Data da Compra <span className="text-red-500">*</span>
            </p>
            <input
              name="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={onChange}
              className={getInputClass('purchaseDate')}
            />
            {errors.purchaseDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.purchaseDate}</p>}
          </label>
          <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{ animationDelay: '750ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">
              Fim da Garantia <span className="text-red-500">*</span>
            </p>
            <input
              name="warrantyEnd"
              type="date"
              value={formData.warrantyEnd}
              onChange={onChange}
              className={getInputClass('warrantyEnd')}
            />
            {errors.warrantyEnd && <p className="text-red-500 text-xs mt-1 font-medium">{errors.warrantyEnd}</p>}
          </label>
        </div>
      </div>
      <div className="p-4 md:p-8 border-b border-border-light dark:border-border-dark">
        <h3 className="text-text-main-light dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">description</span>
          Detalhes Adicionais
        </h3>
        <div className="flex flex-col gap-6">
          <label className="flex flex-col flex-1 animate-slide-up opacity-0" style={{ animationDelay: '800ms' }}>
            <p className="text-text-main-light dark:text-slate-200 text-sm font-medium leading-normal pb-2">Observação</p>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-text-main-light dark:text-white p-4 placeholder:text-text-sub-light dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              placeholder="Adicione detalhes sobre a condição física, acessórios incluídos, etc."
              rows={4}
            ></textarea>
          </label>
        </div>
      </div>
      <div
        className="flex items-center justify-end gap-4 p-4 md:p-8 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark animate-slide-up opacity-0"
        style={{ animationDelay: '850ms' }}
      >
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-lg text-sm font-medium text-text-sub-light dark:text-slate-300 hover:bg-[#e7edf3] dark:hover:bg-slate-700 transition-colors"
          type="button"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-primary hover:bg-blue-600 shadow-md transition-all ${
            isSaving ? 'opacity-80 cursor-wait pl-4 pr-6' : ''
          }`}
          type="button"
          style={{ minWidth: '140px' }}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
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
  );
};

export default AddItemForm;
