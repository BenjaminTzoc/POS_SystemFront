export interface ISalePayment {
  id: string;
  paymentProcessor?: string;
  externalTransactionId?: string;
  paymentLinkId?: string;
  amount: number;
  date: Date;
  referenceNumber?: string;
  bankAccount?: string;
  status: string;
  notes?: string;
  paymentMethod: IPaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  requiresBankAccount: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
