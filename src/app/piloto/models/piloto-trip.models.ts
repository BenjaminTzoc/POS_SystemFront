export type PilotoTripStatus = 'draft' | 'on_route' | 'completed' | 'cancelled';
export type PilotoStopType = 'sale_order' | 'transfer';
export type PilotoStopStatus =
  | 'pending'
  | 'delivered'
  | 'partially_delivered'
  | 'rejected'
  | 'failed';

export interface PilotoTruck {
  id: string;
  name: string;
  licensePlate: string;
}

export interface PilotoProductUnit {
  id?: string;
  name?: string;
  abbreviation?: string;
  allowsDecimals?: boolean;
}

export interface PilotoSaleLine {
  id?: string;
  quantity: number;
  productId?: string;
  product?: {
    id?: string;
    name?: string;
    sku?: string;
    unit?: PilotoProductUnit | null;
  };
  name?: string;
  sku?: string;
}

export type PilotoDeliverOutcome = 'full' | 'partial' | 'rejected';

export interface PilotoDeliverSalePayload {
  otp: string;
  outcome: PilotoDeliverOutcome;
  reason?: string;
  deliveredItems?: {
    saleDetailId: string;
    deliveredQuantity: number;
    productId?: string;
  }[];
}

export interface PilotoDeliverTransferPayload {
  notes?: string;
  items: {
    productId: string;
    receivedQuantity: number;
  }[];
}

export interface PilotoDeliverLine {
  key: string;
  saleDetailId: string;
  productId?: string;
  name: string;
  sku: string;
  unit: string;
  allowsDecimals: boolean;
  ordered: number;
}

export interface PilotoSale {
  id: string;
  invoiceNumber?: string;
  orderNumber?: string;
  customer?: { name?: string; address?: string };
  guestCustomer?: { name?: string; address?: string };
  deliveryAddress?: string;
  notes?: string | null;
  items?: PilotoSaleLine[];
  details?: PilotoSaleLine[];
}

export interface PilotoTransfer {
  id: string;
  transferNumber?: string;
  destinationBranch?: { id?: string; name?: string; address?: string };
  toBranch?: { id?: string; name?: string; address?: string };
  items?: PilotoSaleLine[];
}

export interface PilotoStop {
  id: string;
  type: PilotoStopType;
  status: PilotoStopStatus;
  sequence: number;
  notes?: string;
  sale?: PilotoSale;
  transfer?: PilotoTransfer;
}

export interface PilotoReturnItem {
  id?: string;
  returnedQuantity: number;
  product?: { name?: string; sku?: string; unit?: PilotoProductUnit | null };
}

export interface PilotoReturn {
  id: string;
  status: 'pending_receipt' | 'received_in_warehouse' | 'cancelled';
  reason?: string;
  items?: PilotoReturnItem[];
}

export interface PilotoCreateIncidentPayload {
  description: string;
  tripItemId?: string;
}

export interface PilotoIncident {
  id: string;
  description: string;
  status: 'open' | 'resolved';
  tripItemId?: string;
}

export interface PilotoTrip {
  id: string;
  tripNumber: string;
  date: string;
  status: PilotoTripStatus;
  departureAt?: string;
  notes?: string;
  truck?: PilotoTruck;
  originBranch?: { id?: string; name?: string };
  items?: PilotoStop[];
  returns?: PilotoReturn[];
  incidents?: PilotoIncident[];
  stopCount?: number;
  pendingCount?: number;
}
