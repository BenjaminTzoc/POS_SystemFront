export type TripStatus = 'draft' | 'on_route' | 'completed' | 'cancelled';
export type TripItemType = 'transfer' | 'sale_order';
export type TripItemStatus = 'pending' | 'delivered' | 'partially_delivered' | 'rejected' | 'failed';
export type TripReturnStatus = 'pending_receipt' | 'received_in_warehouse' | 'cancelled';
export type TripIncidentStatus = 'open' | 'resolved';

export interface TripReturnItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    imageUrl?: string;
    unit?: {
      id?: string;
      name?: string;
      abbreviation?: string;
      allowsDecimals?: boolean;
    } | null;
  };
  returnedQuantity: number;
  receivedQuantity?: number | null;
}

export interface TripReturn {
  id: string;
  status: TripReturnStatus;
  reason?: string;
  receptionNotes?: string;
  receivedAt?: string;
  receivedBy?: {
    id: string;
    name: string;
  };
  items: TripReturnItem[];
}

export interface TripIncident {
  id: string;
  description: string;
  status: TripIncidentStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
  };
}

export interface TripItem {
  id: string;
  type: TripItemType;
  status: TripItemStatus;
  sequence: number;
  deliveredAt?: string;
  notes?: string;
  transfer?: any;
  sale?: any;
}

export interface Trip {
  id: string;
  tripNumber: string;
  date: string;
  status: TripStatus;
  departureAt?: string;
  completedAt?: string;
  notes?: string;
  originBranch: {
    id: string;
    name: string;
  };
  truck: {
    id: string;
    name: string;
    licensePlate: string;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  items: TripItem[];
  returns?: TripReturn[];
  incidents?: TripIncident[];
}

export interface PendingOperationsResponse {
  transfers: any[];
  sales: any[];
}

export interface CreateTripItemDto {
  type: TripItemType;
  transferId?: string;
  saleId?: string;
  sequence?: number;
  notes?: string;
}

export interface CreateTripDto {
  date: string;
  originBranchId: string;
  truckId: string;
  driverId: string;
  notes?: string;
  items?: CreateTripItemDto[];
}

export interface DeliverSalePayload {
  otp: string;
  outcome: 'full' | 'partial' | 'rejected';
  reason?: string;
  deliveredItems?: {
    saleDetailId: string;
    deliveredQuantity: number;
    productId?: string;
  }[];
}

export interface DeliverTransferPayload {
  notes?: string;
  items: {
    productId: string;
    receivedQuantity: number;
    transferItemId?: string;
  }[];
}

export interface ReceiveTripReturnPayload {
  notes?: string;
  items?: {
    productId: string;
    receivedQuantity: number;
  }[];
}
