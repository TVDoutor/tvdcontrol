export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar: string;
    itemsCount: number;
    status: 'active' | 'inactive';
}

export interface InventoryItem {
    id: string;
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

export enum ItemStatus {
    Available = 'available',
    InUse = 'in_use',
    Maintenance = 'maintenance',
    Retired = 'retired'
}