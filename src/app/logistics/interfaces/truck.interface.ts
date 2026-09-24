export type TruckStatus = 'active' | 'maintenance' | 'inactive';

export interface Truck {
  id: string;
  name: string;
  licensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status: TruckStatus;
  defaultDriver?: {
    id: string;
    name: string;
    email: string;
  } | null;
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTruckDto {
  name: string;
  licensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  status?: TruckStatus;
  defaultDriverId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateTruckDto extends Partial<CreateTruckDto> {}
