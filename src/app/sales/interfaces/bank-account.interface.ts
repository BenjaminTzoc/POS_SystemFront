export interface IBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  alias: string;
  holderName: string;
  accountType?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
