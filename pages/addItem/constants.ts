import type { InventoryItem } from '../../types';

export type AddItemFormData = {
  category: string;
  type: string;
  manufacturer: string;
  name: string;
  serialNumber: string;
  assetTag: string;
  status: InventoryItem['status'];
  assignedTo: string;
  purchaseDate: string;
  warrantyEnd: string;
  notes: string;
};

export type CategoryOption = {
  value: string;
  label: string;
  icon: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
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
  name: '',
  serialNumber: '',
  assetTag: '',
  status: 'available',
  assignedTo: '',
  purchaseDate: '',
  warrantyEnd: '',
  notes: '',
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.icon || 'inventory_2';
}

