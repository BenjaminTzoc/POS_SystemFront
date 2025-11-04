import { Product } from "../../inventory/interfaces/product.interface";
import { PurchaseStatus } from "../purchase-orders/purchase-order-form/purchase-order-form.component";
import { Supplier } from "./supplier.interface";

export interface IPurchaseDetailPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
}

export interface CreatePurchase {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  supplierId: string;
  notes?: string;
  details: IPurchaseDetailPayload[];
}

export interface IPurchaseOrderPayload {
  invoiceNumber: string;
  date?: Date;
  dueDate: Date;
  status: PurchaseStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  supplierId: string;
  details: IPurchaseDetail[];
  notes: string;
}

export interface IPurchaseDetail {
  product: Product;
  quantity: number;
  unitPrice: number;
  taxPercentage?: number;
  taxAmount: number;
  discount: number;
  lineTotal: number;
}

export interface IPurchaseOrderResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  notes: string;
  supplier?: Supplier;
  details?: IPurchaseDetailResponse[],
  payments?: any[], //CORREGIR ESTO DESPUES
}

export interface IPurchaseDetailResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
  quantity: string;
  unitPrice: string;
  discount: string;
  discountAmount: string;
  taxPercentage: string;
  taxAmount: string;
  lineTotal: string;
}