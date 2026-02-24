import type { InventoryItem } from '../../types';

export type AddItemFormData = {
  category: string;
  type: string;
  manufacturer: string;
  phoneNumber: string;
  name: string;
  serialNumber: string;
  assetTag: string;
  status: InventoryItem['status'];
  assignedTo: string;
  purchaseDate: string;
  warrantyEnd: string;
  notes: string;
  photoMain: string;
};

export type CategoryOption = {
  value: string;
  label: string;
  icon: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: 'Notebook', label: 'Notebook', icon: 'laptop_mac' },
  { value: 'Computadores', label: 'Computadores', icon: 'computer' },
  { value: 'Celulares', label: 'Celulares', icon: 'smartphone' },
  { value: 'Monitores', label: 'Monitores', icon: 'monitor' },
  { value: 'Periféricos', label: 'Periféricos', icon: 'keyboard' },
  { value: 'Chips', label: 'Chips', icon: 'sim_card' },
  { value: 'Acessórios', label: 'Acessórios', icon: 'headphones' },
];

export const INITIAL_FORM_DATA: AddItemFormData = {
  category: '',
  type: '',
  manufacturer: '',
  phoneNumber: '',
  name: '',
  serialNumber: '',
  assetTag: '',
  status: 'available',
  assignedTo: '',
  purchaseDate: '',
  warrantyEnd: '',
  notes: '',
  photoMain: '',
};

export function getCategoryIcon(category: string): string {
  const normalized = (category || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  const iconByCategory: Record<string, string> = {
    notebook: 'laptop_mac',
    notebooks: 'laptop_mac',
    computadores: 'computer',
    computador: 'computer',
    celulares: 'smartphone',
    celular: 'smartphone',
    monitores: 'monitor',
    monitor: 'monitor',
    perifericos: 'keyboard',
    periferico: 'keyboard',
    chips: 'sim_card',
    chip: 'sim_card',
    acessorios: 'headphones',
    acessorio: 'headphones',
    headset: 'headset',
    impressora: 'print',
    impressoras: 'print',
  };

  return iconByCategory[normalized] || 'inventory_2';
}
