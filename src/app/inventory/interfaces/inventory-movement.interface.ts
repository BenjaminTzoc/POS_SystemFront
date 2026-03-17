import { User } from '../../core/models/user.model';
import { Branch } from './branch.interface';
import { Product } from './product.interface';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum MovementConcept {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  INITIAL_STOCK = 'INITIAL_STOCK',
  RETURN = 'RETURN',
}

export enum MovementStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface InventoryMovement {
  id: string;
  createdAt: string;
  updatedAt: string;
  product: Product;
  branch: Branch;
  createdBy: User;
  completedBy?: User;
  cancelledBy?: User;
  quantity: number;
  type: MovementType;
  status: MovementStatus;
  referenceId?: string;
  referenceNumber?: string;
  sourceBranch?: Branch;
  targetBranch?: Branch;
  notes?: string;
  movementDate: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  unitCost?: number;
  totalCost?: number;
  previousStock?: number;
  newStock?: number;
  concept?: MovementConcept;
}
