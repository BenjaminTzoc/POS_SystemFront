import { Product } from '../../inventory/interfaces/product.interface';
import { ICustomer } from './customer.interface';
import { Area } from '../../logistics/interfaces/area.interface';

export interface ISaleOrderResponse {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
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
  customer?: ICustomer;
  branch?: any;
  guestCustomer?: any;
  discountCode?: any; // CORREGIR ESTO DESPUÉS
  details?: ISaleDetailResponse[];
  payments?: any[]; // CORREGIR ESTO DESPUÉS
  discounts?: any[];
  applyTax?: boolean;
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
  currentArea?: Area;
  preparationStatus?: 'pending' | 'preparing' | 'completed';
  discountType?: 'percentage' | 'fixed_amount';
  notes?: string;
}


export interface IGroupedItem {
  id: string; // Detail ID
  product: Product;
  quantity: number;
  preparationStatus: 'pending' | 'preparing' | 'completed';
  currentArea: Area;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
}

export interface ISaleGroupedByStatus {
  [status: string]: {
    total: number;
    orders: ISaleOrderResponse[];
  };
}

export interface ISaleGroupedByPreparation {
  [status: string]: {
    total: number;
    items: IGroupedItem[];
  };
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
  lineSurcharge?: number;
  subtotalAfterLineDiscount?: number;
  discountType?: 'percentage' | 'fixed_amount';
  discountAmount?: number;
  notes?: string;
}

