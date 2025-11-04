export interface Supplier {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    nit: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    accountNumber: string;
    notes: string;
}

export interface ICreateSupplier {
    name: string;
    nit?: string;
    contactName: string;
    email?: string;
    phone: string;
    address?: string;
    accountNumber?: string;
    notes?: string;
}

export interface IEditSupplier {
    name?: string;
    nit?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    accountNumber?: string;
    notes?: string;
}