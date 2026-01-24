export interface DashboardSummaryDto {
  totalSalesToday: number;
  pendingOrdersCount: number;
  inventoryValue: number;
  lowStockProductsCount: number;
}

export interface SalesTrendDto {
  date: string; // ISO string or formatted date
  total: number;
  orderCount?: number;
}

export interface TopSellingProductDto {
  productName: string;
  quantity: number;
  revenue: number;
}

export interface CategoryDistributionDto {
  category: string;
  productCount: number;
  percentage: number;
}

export interface PaymentMethodStatDto {
  method: string;
  count: number;
  total: number;
}

export interface LowStockProductDto {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock?: number;
  branchName?: string;
}

export interface HourlySalesDto {
  hour: number;
  count: number;
  total: number;
}

export interface WeekdaySalesDto {
  day: string;
  index: number;
  count: number;
  total: number;
}

export interface InventoryMovementReportDto {
  date: string;
  entries: number;
  exits: number;
}

export interface ProfitReportDto {
  date: string;
  revenue: number;
  expenses: number;
  profit: number;
}
