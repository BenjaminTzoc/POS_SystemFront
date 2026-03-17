import { Product } from '../../inventory/interfaces/product.interface';

export interface RouteDispatch {
  id?: string;
  date: string;
  branchId: string; // Destination
  originBranchId?: string; // Source
  notes?: string;
  status?: 'sent' | 'received' | 'closed' | 'cancelled' | 'reconciled';
  branch?: { id: string; name: string }; // Destination branch object
  originBranch?: { id: string; name: string }; // Source branch object
  responsible?: { id: string; name: string };
  items: RouteDispatchItem[];
  createdAt?: string;
  updatedAt?: string;
  liquidatedAt?: string;
}

export interface RouteDispatchItem {
  id?: string;
  productId: string;
  product?: Product;
  sentQuantity: number;
  receivedQuantity?: number;
  soldQuantity?: number;
  returnedQuantity?: number;
  stayedQuantity?: number;
  wasteQuantity?: number;
  suggestedSoldQuantity?: number;
  discrepancy?: number;
  notes?: string;
}
