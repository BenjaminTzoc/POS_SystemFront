import { ICustomer } from './customer.interface';
import { Product } from '../../inventory/interfaces/product.interface';
import { Branch } from '../../inventory/interfaces/branch.interface';

export type QuotationStatus = 'PENDING' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';

export interface IQuotationItem {
  id?: string;
  quotationId?: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: Product;
}

export interface IQuotation {
  id: string;
  customerId: string;
  customerName?: string;
  branchId: string;
  branchName?: string;
  quotationNumber: string;
  status: QuotationStatus;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  customer?: ICustomer;
  branch?: Branch;
  items: IQuotationItem[];
  saleId?: string;
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
  customerId: string;
  branchId: string;
  validityDays?: number;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}
