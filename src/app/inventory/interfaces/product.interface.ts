import { Inventory } from './inventory.interface';
import { Area } from '../../logistics/interfaces/area.interface';

export enum ProductType {
  RAW_MATERIAL = 'raw_material',      // Para Compras y Despiece
  INSUMO = 'insumo',                  // Para Compras y Recetas
  COMPONENT = 'component',            // Resultado de Despiece
  FINISHED_PRODUCT = 'finished_product' // Para Manufactura y Logística
}

export interface Category {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  defaultUnit: Unit | null;
  deletedAt?: string;
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
  type?: ProductType;
  category?: Category;
  unit: Unit;
  area?: Area;
  stock?: number;
  manageStock?: boolean;
  stockAvailability?: string;
  isActive?: boolean;
  isVisible?: boolean;
  inventories?: any[];
  isMaster?: boolean;
  isVariant?: boolean;
  variants?: Product[];
  parentId?: string | null;
  deletedAt?: string;
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
  type?: ProductType;
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
  area?: Area;
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
  type?: ProductType;
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
