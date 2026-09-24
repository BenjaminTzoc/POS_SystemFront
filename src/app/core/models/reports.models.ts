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
  saleId: string;
  id?: string;
  invoiceNumber: string;
  customerName: string;
  customerId?: string | null;
  phone: string | null;
  pendingAmount: number;
  paidAmount: number;
  total: number;
  billingStartDate: string | null;
  dueDate: string;
  isOverdue: boolean;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  lastRemindedAt: string | null;
  branchName: string;
  isPreorder: boolean;
  delivered: boolean;
  notes: string | null;
}

export interface CollectionReminderResultDto {
  saleId: string;
  channel: 'whatsapp';
  to: string;
  sentAt: string;
  lastRemindedAt: string;
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

export interface CustomerWeeklyKpisDto {
  topCustomer: { id: string | null; name: string; total: number } | null;
  averageTicket: number;
  top5Concentration: number;
  pendingAmount: number;
  activeCustomerCount: number;
}

export interface CustomerWeeklyMixItemDto {
  productId: string | null;
  productName: string;
  quantity: number;
  unit: string;
  revenue: number;
  share: number;
}

export interface CustomerWeeklyDayDto {
  date: string;
  day: 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom' | string;
  total: number;
  orderCount: number;
}

export interface CustomerWeeklyItemDto {
  id: string | null;
  name: string;
  isGuest: boolean;
  category: {
    id: string | null;
    name: string;
  };
  total: number;
  orderCount: number;
  averageTicket: number;
  trendPercent: number;
  paidAmount: number;
  pendingAmount: number;
  creditLimit: number;
  creditUsed: number;
  lastPurchaseDate: string | null;
  inactiveThisWeek: boolean;
  preorderCommitted: number;
  topProduct: {
    productId: string | null;
    name: string;
    quantity: number;
    unit: string;
  } | null;
  mix: CustomerWeeklyMixItemDto[];
  days: CustomerWeeklyDayDto[];
}

export interface CustomerWeeklySummaryDto {
  period: {
    start: string;
    end: string;
  };
  kpis: CustomerWeeklyKpisDto;
  customers: CustomerWeeklyItemDto[];
}

export interface TodayPulsePeakHourDto {
  hour: number | null;
  label: string | null;
}

export interface TodayPulseSalesDto {
  total: number;
  previousTotal: number;
  changePercent: number;
  ticketCount: number;
  averageTicket: number;
  cashToday: number;
  creditToday: number;
  otherToday: number;
  peakHour: TodayPulsePeakHourDto;
}

export interface TodayPulsePendingDto {
  total: number;
  preparing: number;
  delivery: number;
  preorder: number;
  oldestMinutes: number | null;
  nextCustomer: { saleId: string; name: string } | null;
}

export interface TodayPulseReceivableDto {
  total: number;
  overdue: number;
  dueToday: number;
  invoiceCount: number;
  topDebtor: { customerId: string | null; name: string; amount: number } | null;
}

export interface TodayPulseLowStockDto {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  branchName?: string;
}

export interface TodayPulseAttentionDto {
  lowStockCount: number;
  preordersForToday: number;
  lowStock: TodayPulseLowStockDto[];
}

export interface TodayPulseDto {
  date: string;
  currency: 'GTQ' | string;
  sales: TodayPulseSalesDto;
  pending: TodayPulsePendingDto;
  receivable: TodayPulseReceivableDto;
  attention: TodayPulseAttentionDto;
}

export interface TodayPaymentsSummaryDto {
  total: number;
  count: number;
  cash: number;
  transfer: number;
  other: number;
  settled: number;
}

export interface TodayPaymentItemDto {
  id: string;
  saleId: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string | null;
  amount: number;
  remainingBalance: number;
  methodCode: 'cash' | 'transfer' | 'card' | 'other';
  methodName: string;
  paidAt: string;
  time: string;
  reference: string | null;
  isDownPayment: boolean;
  branchName: string;
  branchId: string;
}

export interface TodayPaymentsDto {
  date: string;
  currency: 'GTQ' | string;
  summary: TodayPaymentsSummaryDto;
  payments: TodayPaymentItemDto[];
}
