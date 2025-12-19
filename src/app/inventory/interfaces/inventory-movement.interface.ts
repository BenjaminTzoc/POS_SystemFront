import { User } from '../../core/models/user.model';
import { Branch } from './branch.interface';
import { Product } from './product.interface';

export enum MovementType {
  IN = 'in', // Entrada de stock
  OUT = 'out', // Salida de stock (ventas, mermas)
  TRANSFER_OUT = 'transfer_out', // Transferencia entre sucursales (salida)
  TRANSFER_IN = 'transfer_in', // Transferencia entre sucursales (entrada)
  ADJUSTMENT = 'adjustment', // Ajuste de inventario
}

export enum MovementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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
  concept?: string;
}
