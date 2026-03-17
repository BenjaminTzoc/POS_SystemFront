import { Product } from "../../inventory/interfaces/product.interface";
import { Branch } from "../../inventory/interfaces/branch.interface";

export interface IDecompositionItem {
  productId: string;
  quantity: number;
  costPercentage: number;
  // Para visualización
  unitCost?: number;
  totalCost?: number;
  product?: Product;
}

export interface ICreateDecomposition {
  inputProductId: string;
  branchId: string;
  inputQuantity: number;
  totalCost: number;
  wasteQuantity: number;
  items: IDecompositionItem[];
}

export interface IDecompositionResponse {
  id: string;
  createdAt: string;
  inputProduct: Product;
  branch: Branch;
  inputQuantity: number;
  totalCost: number;
  wasteQuantity: number;
  items: {
    id: string;
    product: Product;
    quantity: number;
    costPercentage: number;
    unitCost: number;
    totalCost: number;
  }[];
}
