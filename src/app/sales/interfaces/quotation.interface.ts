import { ICustomer } from './customer.interface';
import { Product } from '../../inventory/interfaces/product.interface';
import { Branch } from '../../inventory/interfaces/branch.interface';

export type QuotationStatus = 'PENDING' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';
export type QuotationAdjustmentType = 'discount' | 'increase';
export type QuotationValueType = 'percentage' | 'fixed_amount';
export type DiscountType = 'percentage' | 'fixed_amount';

export interface IQuotationItem {
  id?: string;
  quotationId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: DiscountType;
  taxPercentage: number;
  notes?: string;
  subtotal: number;
  product?: Product;
}

export interface IQuotationAdjustment {
  id?: string;
  quotationId?: string;
  adjustmentType: QuotationAdjustmentType;
  valueType: QuotationValueType;
  value: number;
  reason: string;
}

export interface IQuotation {
  id: string;
  customerId?: string;
  customerName?: string;
  branchId: string;
  branchName?: string;
  quotationNumber: string;
  correlative: string;
  status: QuotationStatus;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  customer?: ICustomer;
  guestCustomer?: {
    name: string;
    phone?: string;
    email?: string;
    nit?: string;
    address?: string;
  };
  branch?: Branch;
  items: IQuotationItem[];
  adjustments?: IQuotationAdjustment[];
  saleId?: string;
  applyTax?: boolean;
}

export interface IQuotationResponse {
  statusCode: number;
  message: string;
  data: IQuotation[];
}

export interface IQuotationDetailResponse {
  statusCode: number;
  message: string;
  data: IQuotation;
}

export interface IQuotationConvertResponse {
  statusCode: number;
  message: string;
  data: {
    saleId: string;
  };
}

export interface CreateQuotationDto {
  customerId?: string;
  branchId: string;
  validityDays?: number;
  applyTax?: boolean;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    discountType?: DiscountType;
    taxPercentage?: number;
    notes?: string;
  }[];
  adjustments?: {
    adjustmentType: QuotationAdjustmentType;
    valueType: QuotationValueType;
    value: number;
    reason: string;
  }[];
  guestCustomer?: {
    name: string;
    phone?: string;
    email?: string;
    nit?: string;
    address?: string;
  };
}
