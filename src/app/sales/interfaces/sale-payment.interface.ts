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
