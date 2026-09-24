export interface ISalePayment {
  id: string;
  paymentProcessor?: string;
  externalTransactionId?: string;
  paymentLinkId?: string;
  amount: number;
  date: Date;
  referenceNumber?: string;
  manualBankAccount?: string;
  status: string;
  notes?: string;
  isDownPayment: boolean;
  bankAccountId?: string;
  bankAccount?: any;
  paymentMethod: IPaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  requiresBankAccount: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptPaymentItem {
  id: string;
  date: string;
  amount: number;
  previousBalance: number;
  remainingBalance: number;
  isDownPayment: boolean;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
  };
  referenceNumber?: string | null;
  bankAccount?: {
    id: string;
    bankName: string;
    accountNumber: string;
  } | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

export interface ISaleReceiptsData {
  saleId: string;
  invoiceNumber: string;
  saleDate: string;
  saleStatus: string;
  isPreorder?: boolean;
  promisedDeliveryDate?: string | null;
  customer?: {
    id?: string;
    name: string;
    nit?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  branch?: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
  };
  financialSummary: {
    totalSale: number;
    totalPaid: number;
    currentPending: number;
    isFullyPaid: boolean;
  };
  payments: IReceiptPaymentItem[];
}

export interface ISingleReceiptData {
  saleId: string;
  invoiceNumber: string;
  saleDate: string;
  customer?: {
    id?: string;
    name: string;
    nit?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  branch?: {
    id?: string;
    name: string;
    address?: string;
    phone?: string;
  };
  financialSummary?: {
    totalSale: number;
    totalPaid: number;
    currentPending: number;
    isFullyPaid: boolean;
  };
  currentPayment: IReceiptPaymentItem;
}
