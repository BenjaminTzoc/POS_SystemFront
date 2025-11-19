import { Product } from '../../inventory/interfaces/product.interface';
import { ICustomer } from './customer.interface';

export interface ISaleOrderResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  invoiceNumber: string;
  date: Date;
  type: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  categoryDiscount: string;
  codeDiscount: string;
  total: string;
  paidAmount: string;
  pendingAmount: string;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  notes: string;
  customer: ICustomer;
  discountCode?: any; // CORREGIR ESTO DESPUÉS
  details?: ISaleDetailResponse[];
  payments?: any[]; // CORREGIR ESTO DESPUÉS
}

export interface ISaleDetailResponse {
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

export interface ISaleDetailPayload {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxPercentage?: number;
  lineSubtotal?: number;
  lineDiscount?: number;
  lineTax?: number;
  lineTotal?: number;
}
