export type UserRole = 'Administrador' | 'Gerente' | 'Usuario';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
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
}

export type InventoryHistoryEvent = {
    id: string;
    color: 'primary' | 'slate' | 'success' | 'danger';
    date: string;
    title: string;
    desc: string;
};

export enum ItemStatus {
    Available = 'available',
    InUse = 'in_use',
    Maintenance = 'maintenance',
    Retired = 'retired'
}
