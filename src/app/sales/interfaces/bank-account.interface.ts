export interface IBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  alias: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
