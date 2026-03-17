export interface DashboardSummaryDto {
  totalSalesToday: number;
  pendingOrdersCount: number;
  inventoryValue: number;
  lowStockProductsCount: number;
}

export interface SalesTrendDto {
  date: string;
  total: number;
}

export interface CategorySalesItemDto {
  category: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface CategorySalesReportDto {
  period: { start: string; end: string };
  totalRevenue: number;
  categories: CategorySalesItemDto[];
}

export interface ProductPerformanceReportDto {
  topSelling: ProductPerformanceItemDto[];
  leastSelling: ProductPerformanceItemDto[];
  stagnantProducts: ProductPerformanceItemDto[];
}

export interface ProductPerformanceItemDto {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface BranchPerformanceItemDto {
  branchName: string;
  revenue: number;
  count: number;
  averageTicket: number;
}

export interface BranchPerformanceReportDto {
  period: { start: string; end: string };
  branches: BranchPerformanceItemDto[];
}

export interface CriticalStockDto {
  productName: string;
  sku: string;
  stock: number;
  minStock: number;
  status: string;
  color: string;
  indicator: string;
  branch?: string;
}

export interface LowStockProductDto extends CriticalStockDto {}

export interface HourlySalesDto {
  hour: number;
  count: number;
  total: number;
}

export interface WasteTrendDto {
  date: string;
  quantity: number;
}

export interface WasteByProductDto {
  productName: string;
  quantity: number;
}

export interface UnifiedDashboardDto {
  totalRevenue: number;
  period: {
    start: string;
    end: string;
  };
  cards: DashboardSummaryDto;
  salesTrends: SalesTrendDto[];
  categorySales: CategorySalesItemDto[];
  productPerformance: ProductPerformanceReportDto;
  branchPerformance: BranchPerformanceItemDto[];
  criticalStock: CriticalStockDto[];
  hourlySales: HourlySalesDto[];
  wasteTrends: WasteTrendDto[];
  wasteByProduct: WasteByProductDto[];
}

export interface ProductKardexDto {
  date: string;
  entries: number;
  exits: number;
  stock: number;
}

export interface TopSellingProductDto {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  revenue: number;
  percentage?: number;
}
export interface OrderStatDto {
  total: number;
  percentageChange: number;
  trend: 'up' | 'down';
}

export interface ProductStatDto {
  total: number;
  newToday: number;
}

export interface LowStockAlertDto {
  productId: string;
  branchId: string;
  branchName: string;
  code: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  message: string;
}

export interface HourlySalesDataDto {
  hour: string;
  total: number;
}

export interface HourlySalesSummaryDto {
  date: string;
  currency: string;
  data: HourlySalesDataDto[];
}

export interface RecentTransactionDto {
  id: string;
  time: string;
  amount: number;
  status: string;
  customer: string;
  branch: string;
}

export interface PaymentDetailDto {
  amount: number;
  count: number;
}

export interface PaymentStatusSummaryDto {
  paid: PaymentDetailDto;
  pending: PaymentDetailDto;
  overdue: PaymentDetailDto;
}

export interface OrderSummaryReportDto {
  total: OrderStatDto;
  pending: OrderStatDto;
  completed: OrderStatDto;
  products: ProductStatDto;
  lowStockAlerts: LowStockAlertDto[];
  hourlySales: HourlySalesSummaryDto;
  recentTransactions: RecentTransactionDto[];
  paymentStatus: PaymentStatusSummaryDto;
}

export interface CalendarOrderDto {
  invoiceNumber: string;
  customerName: string;
  pendingAmount: number;
  total: number;
  isOverdue: boolean;
}

export interface CalendarEventDto {
  type: string;
  label: string;
  count: number;
  total: number;
  color: string;
  dotColor: string;
  orders: CalendarOrderDto[];
}

export interface DashboardCalendarDto {
  [date: string]: CalendarEventDto[];
}

export interface WeeklyConsolidationBreakdownDto {
  payments: { method: string; total: number }[];
  topCategories: { category: string; total: number }[];
  peakDay: { day: string; total: number } | null;
}

export interface WeeklyConsolidationItemDto {
  week: string;
  startDate: string;
  endDate: string;
  dateRange: string;
  total: number;
  count: number;
  averageTicket: number;
  trend: 'up' | 'down' | 'equal';
  breakdown: WeeklyConsolidationBreakdownDto;
}

export interface DailyBreakdownItemDto {
  day: string;
  total: number;
}

export interface ProductConsolidationItemDto {
  sku: string;
  name: string;
  total: number;
  days: DailyBreakdownItemDto[];
}

export interface CustomerConsolidationItemDto {
  id: string;
  name: string;
  total: number;
  days: DailyBreakdownItemDto[];
}

export interface WeeklyDataConsolidationDto<T> {
  period: { start: string; end: string };
  data: T[];
}

export interface WeeklyConsolidationBranchDto {
  branchId: string;
  branchName: string;
  totalRevenue: number;
  weeks: WeeklyConsolidationItemDto[];
}

export interface ProductMonthlyTrendSeriesDto {
  name: string;
  data: number[];
}

export interface ProductMonthlyTrendPaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductMonthlyTrendDto {
  month: number;
  year: number;
  categories: string[];
  series: ProductMonthlyTrendSeriesDto[];
  pagination: ProductMonthlyTrendPaginationDto;
}
