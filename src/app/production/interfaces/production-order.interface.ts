import { Product } from "../../inventory/interfaces/product.interface";
import { Branch } from "../../inventory/interfaces/branch.interface";

export type ProductionOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface IProductionOrder {
  id: string;
  createdAt: string;
  updatedAt: string;
  productId: string;
  product: Product;
  branchId: string;
  branch: Branch;
  plannedQuantity: number;
  actualQuantity?: number;
  status: ProductionOrderStatus;
  completedAt?: string;
  totalCost?: number;
  unitCost?: number;
  notes?: string;
  recipe?: Array<{
    componentId: string;
    componentName: string;
    sku: string;
    unit: string;
    requiredQuantity: number;
    unitQuantity: number;
    currentStock: number;
    hasStock: boolean;
  }>;
  movements?: Array<{
    id: string;
    productName: string;
    sku: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }>;
}

export interface ICreateProductionOrder {
  productId: string;
  plannedQuantity: number;
  branchId: string;
}

export interface ICompleteProductionOrder {
  actualQuantity: number;
}
