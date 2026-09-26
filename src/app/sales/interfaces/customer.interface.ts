export interface ICustomer {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    nit: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    loyaltyPoints: number;
    totalPurchases: string;
    lastPurchaseDate: Date;
    category: ICustomerCategory;
    creditLimit: number;
    deletedAt?: string | null;
}

export interface ICustomerProductPrice {
  id?: string;
  productId: string;
  price: number;
  isActive?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  product?: {
    id: string;
    name: string;
    sku?: string;
    price?: number | string;
  };
}

export interface IAppliedProductPrice {
  listPrice: number;
  price: number;
  source: 'custom' | 'list';
}

export interface ICustomerCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  discountPercentage: number;
  minPurchaseAmount: number;
  isActive: boolean;
  defaultCreditLimit: number;
  deletedAt?: string | null;
}