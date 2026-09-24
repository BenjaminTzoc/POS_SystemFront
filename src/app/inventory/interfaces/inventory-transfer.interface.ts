import { User } from '../../core/models/user.model';
import { Branch } from './branch.interface';
import { Product } from './product.interface';

export type TransferStatus = 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

export interface InventoryTransferItem {
  id?: string;
  transferId?: string;
  productId: string;
  productName?: string;
  sku: string;
  quantity: number;
  unitAbbreviation?: string;
  price: number;
  subtotal: number;
  imageUrl?: string;
  product?: Product;
}

export interface InventoryTransfer {
  id: string;
  originBranchId: string;
  originBranchName: string;
  destinationBranchId: string;
  destinationBranchName: string;
  transferNumber: string;
  status: TransferStatus;
  notes?: string;
  totalValue?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tripId?: string;
  tripItemId?: string;
  trip?: { id: string };
  tripItem?: { id: string };
  items?: InventoryTransferItem[];
}

export interface InventoryTransferResponse {
  statusCode: number;
  message: string;
  data: InventoryTransfer[];
}

export interface CreateInventoryTransferDto {
  originBranchId: string;
  destinationBranchId: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateInventoryTransferDto {
  originBranchId?: string;
  destinationBranchId?: string;
  notes?: string;
  items?: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateTransferStatusDto {
  status: TransferStatus;
}
