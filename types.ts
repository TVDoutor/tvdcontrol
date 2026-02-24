export type UserRole = 'Administrador' | 'Gerente' | 'Usuario';

/** Usuário de sistema: pode incluir, excluir e ajustar dados (Administrador, Gerente) */
export const SYSTEM_ROLES: UserRole[] = ['Administrador', 'Gerente'];

/** Usuário de produto/inventário: usa o inventário, não gerencia sistema (Usuario) */
export const PRODUCT_ROLES: UserRole[] = ['Usuario'];

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    role: UserRole;
    department: string;
    jobTitle?: string;
    avatar: string;
    itemsCount: number;
    status: 'active' | 'inactive';
}

export interface InventoryItem {
    id: string;
    // Campos usados nas telas atuais (mocks)
    name?: string;         // ex: "MacBook Pro..."
    desc?: string;         // ex: "Apple Silicon"
    sku?: string;          // ex: "AST-00124"
    icon?: string;         // Material Symbols name

    serialNumber: string;
    model: string;
    type?: string;
    manufacturer: string;
    category: string;
    status: 'available' | 'in_use' | 'maintenance' | 'retired';
    assignedTo?: string; // User ID
    purchaseDate: string;
    purchasePrice?: number;
    warrantyEnd: string;
    location?: string;
    specs?: string;
    notes?: string;
    photoMain?: string;
}

export type InventoryHistoryEvent = {
    id: string;
    color: 'primary' | 'slate' | 'success' | 'danger';
    date: string;
    title: string;
    desc: string;
    returnPhoto?: string;
    returnNotes?: string;
    returnItems?: string;
};

export enum ItemStatus {
    Available = 'available',
    InUse = 'in_use',
    Maintenance = 'maintenance',
    Retired = 'retired'
}
