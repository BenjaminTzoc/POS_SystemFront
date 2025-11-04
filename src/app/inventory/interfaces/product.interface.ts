export interface Category {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  defaultUnit: Unit | null;
}

export interface Unit {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  abbreviation: string;
  allowsDecimals: boolean;
  description: string;
}

export interface Product {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  cost: string;
  price: string;
  imageUrl: string;
  category: Category;
  unit: Unit;
  stock: number;
}