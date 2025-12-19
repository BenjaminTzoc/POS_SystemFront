import { Inventory } from './inventory.interface';

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
  stock?: number;
  inventories?: Inventory[];
}

//INVENTARIOS

export interface ProductWithInventory {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  cost: number;
  price: number;
  imageUrl: string;
  manageStock: boolean;
  stockAvailability: string;
  isActive: boolean;
  isVisible: boolean;
  inventories: Array<{
    id: string;
    branchId: string;
    branchName: string;
    stock: number;
  }>;
  category: {
    name: string;
    description: string;
    defaultUnit: {
      name: string;
      abbreviation: string;
      allowsDecimals: boolean;
    };
  };
  unit: {
    name: string;
    abbreviation: string;
    allowsDecimals: boolean;
  };
}

export interface ProductInventoryCard {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string;
  price: number;
  imageUrl: string;
  manageStock: boolean;
  isActive: boolean;
  isVisible: boolean;
  category: string;
  unit: string;
  unitAbbreviation: string;
  allowsDecimals: boolean;

  // Stock por sucursal
  inventories: Array<{
    inventoryId: string;
    branchId: string;
    branchName: string;
    currentStock: number;
  }>;

  // Totales
  totalStock: number;
  totalBranches: number;
  hasMultipleBranches: boolean;
}
