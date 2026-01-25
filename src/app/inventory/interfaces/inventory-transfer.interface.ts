import { Branch } from './branch.interface';
import { Product } from './product.interface';

export type TransferStatus = 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

export interface InventoryTransferItem {
  id?: string;
  transferId?: string;
  productId: string;
  productName?: string;
  quantity: number;
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: InventoryTransferItem[];
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

export interface UpdateTransferStatusDto {
  status: TransferStatus;
}
