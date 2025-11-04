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
}

export interface ICustomerCategory {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  discountPercentage: number;
  minPurchaseAmount: number;
  isActive: boolean
}