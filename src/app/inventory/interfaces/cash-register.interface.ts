export type CashSessionStatus = 'OPEN' | 'CLOSED';

export interface CashSession {
  id: string;
  status: CashSessionStatus;
  openingBalance: number;
  openedAt: string;
  closedAt?: string;
  expectedBalance?: number;
  closingBalance?: number;
  difference?: number;
  notes?: string;
  branchId: string;
  branchName?: string;
  userId: string;
  userName?: string;
  totalCashSales?: number;
}

export interface OpenCashRequest {
  openingBalance: number;
  branchId: string;
  notes?: string;
}

export interface CloseCashRequest {
  closingBalance: number;
  notes?: string;
}
