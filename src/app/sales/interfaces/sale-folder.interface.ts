export interface SaleFolderDto {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  branchId: string;
  branchName: string;
  saleCount: number;
  createdById: string;
  createdAt: string;
}

export interface SaleFolderSaleDto {
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  status: string;
  total: number;
  date: string;
  sortOrder: number;
}

export interface SaleFolderDetailDto extends SaleFolderDto {
  sales: SaleFolderSaleDto[];
}

export interface CreateSaleFolderDto {
  name: string;
  color?: string;
  branchId?: string;
  sortOrder?: number;
}

export interface UpdateSaleFolderDto {
  name?: string;
  color?: string;
  sortOrder?: number;
}

export interface AddSalesToFolderDto {
  saleIds: string[];
}

export interface ReorderFolderSalesDto {
  items: { saleId: string; sortOrder: number }[];
}
