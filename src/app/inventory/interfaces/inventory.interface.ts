import { Branch } from "./branch.interface";
import { Product } from "./product.interface";

export interface Inventory {
  id: string;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  branch?: Branch;
  branchId?: string;
  branchName?: string;
  stock: number;
  minStock?: number;
  maxStock?: number;
  lastMovementDate?: string;
}