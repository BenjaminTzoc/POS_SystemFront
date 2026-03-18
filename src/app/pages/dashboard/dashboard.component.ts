import { Component, OnInit, signal, effect, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ReportsService } from '../../core/services/reports.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { Router } from '@angular/router';
import { StockAlertsComponent } from '../../shared/components/stock-alerts/stock-alerts.component';
import { ProductTrendsWidgetComponent } from './components/product-trends-widget/product-trends-widget.component';
import { 
  OrderSummaryReportDto, 
  HourlySalesDataDto, 
  PaymentStatusSummaryDto, 
  DashboardCalendarDto, 
  WeeklyConsolidationItemDto,
  WeeklyConsolidationBranchDto,
  ProductConsolidationItemDto,
  CustomerConsolidationItemDto,
  WeeklyDataConsolidationDto
} from '../../core/models/reports.models';
import { SaleStatusPipe } from "../../shared/pipes/sale-status.pipe";
import { 
  NgApexchartsModule, 
  ChartComponent, 
  ApexNonAxisChartSeries, 
  ApexPlotOptions, 
  ApexChart, 
  ApexLegend, 
  ApexResponsive 
} from 'ng-apexcharts';

export type PaymentChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive | ApexResponsive[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    CardModule,
    TableModule,
    ButtonModule,
    DatePickerModule,
    SelectModule,
    StockAlertsComponent,
    SaleStatusPipe,
    NgApexchartsModule,
    TooltipModule,
],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  Object = Object;
  today = new Date();
  reportData: OrderSummaryReportDto | null = null;

  hourlySalesData: any;
  hourlySalesOptions: any;

  // ApexCharts Polar Area
  public paymentApexChart: any = {};

  isLoadingDashboard = false;
  isLoadingBranches = false;
  branches: Branch[] = [];
  selectedBranchId: string | undefined;
  calendarData = signal<DashboardCalendarDto>({});
  loadingCalendar = signal<boolean>(false);
  calendarMonth = signal<Date>(new Date());
  selectedDateKey = signal<string | null>(null);
  
  // Weekly Consolidation
  weeklyConsolidation = signal<WeeklyConsolidationBranchDto[]>([]);
  loadingWeeklyConsolidation = signal<boolean>(false);
  weeklyDate = signal<Date>(new Date());

  // Drill-down Detail
  viewMode = signal<'general' | 'detailed'>('general');
  detailTab = signal<'products' | 'customers'>('products');
  selectedWeekStart = signal<string | null>(null);
  detailBranchId = signal<string | undefined>(undefined);
  detailPeriod = signal<{ start: string; end: string } | null>(null);
  productsConsolidation = signal<ProductConsolidationItemDto[]>([]);
  customersConsolidation = signal<CustomerConsolidationItemDto[]>([]);
  loadingDetail = signal<boolean>(false);

  weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  currentCashSession = signal<CashSession | null>(null);

  get canFilterByBranch(): boolean {
    const user = this.authService.currentUser;
    return user?.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  constructor(
    private reportsService: ReportsService,
    private branchesService: BranchesService,
    private authService: AuthService,
    private cashService: CashRegisterService,
    private router: Router,
  ) {
    try {
      this.initChartOptions();
    } catch (e) {
      console.error('Error initializing chart options:', e);
    }
  }

  ngOnInit(): void {
    try {
      if (this.canFilterByBranch) {
        this.loadBranches();
      }
      this.loadAllData();
    } catch (e) {
      console.error('Error on dashboard init:', e);
    }
  }


  loadAllData() {
    this.loadOrderSummary();
    this.checkCashStatus();
    this.loadCalendarData();
    this.loadWeeklyConsolidation();
  }

  private checkCashStatus() {
    this.cashService.getStatus().subscribe({
      next: (res) => this.currentCashSession.set(res.data),
    });
  }

  private loadBranches() {
    this.isLoadingBranches = true;
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        this.branches = res.data;
        this.isLoadingBranches = false;
      },
      error: () => (this.isLoadingBranches = false),
    });
  }

  loadOrderSummary() {
    this.isLoadingDashboard = true;

    this.reportsService.getOrderSummary().subscribe({
      next: (res) => {
        this.reportData = res.data;
        if (this.reportData) {
          this.updateHourlySalesChart(this.reportData.hourlySales.data);
          this.updatePaymentChart(this.reportData.paymentStatus);
        }
        this.isLoadingDashboard = false;
      },
      error: (err) => {
        console.error('Error loading order summary', err);
        this.isLoadingDashboard = false;
      },
    });
  }

  onFilterChange() {
    this.loadAllData();
  }

  loadCalendarData() {
    this.loadingCalendar.set(true);
    const date = this.calendarMonth();
    this.reportsService.getDashboardCalendar(
      date.getMonth() + 1,
      date.getFullYear()
    ).subscribe({
      next: (res) => {
        this.calendarData.set(res.data);
        this.loadingCalendar.set(false);
      },
      error: () => this.loadingCalendar.set(false)
    });
  }

  onCalendarMonthChange(event: any) {
    if (event.month !== undefined && event.year !== undefined) {
      const newDate = new Date(event.year, event.month - 1, 1);
      this.calendarMonth.set(newDate);
      this.selectedDateKey.set(null);
      this.loadCalendarData();
    }
  }

  getEventsForDate(date: any): any[] {
    if (!date) return [];
    const year = date.year;
    const month = (date.month + 1).toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    return this.calendarData()[key] || [];
  }

  onDateSelect(date: any) {
    if (!date) return;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    this.selectedDateKey.set(key);
  }

  loadWeeklyConsolidation() {
    this.loadingWeeklyConsolidation.set(true);
    const date = this.weeklyDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    this.reportsService.getWeeklyConsolidation(month, year).subscribe({
      next: (res) => {
        this.weeklyConsolidation.set(res.data);
        this.loadingWeeklyConsolidation.set(false);
      },
      error: () => this.loadingWeeklyConsolidation.set(false)
    });
  }

  onWeeklyMonthChange(date: any) {
    if (date instanceof Date) {
      this.weeklyDate.set(date);
    } else if (date.month !== undefined && date.year !== undefined) {
      this.weeklyDate.set(new Date(date.year, date.month - 1, 1));
    }
    this.loadWeeklyConsolidation();
  }

  get weeklyWeeks(): { week: string, label: string, dateRange: string, shortDateRange: string, startDate: string }[] {
    const data = this.weeklyConsolidation();
    if (data.length === 0) return [];
    
    // Since all branches now have the same weeks (filled gaps), 
    // we can just take the first branch's weeks.
    return data[0].weeks.map((w, index) => ({
      week: w.week,
      label: `Semana ${index + 1}`,
      dateRange: `${this.formatDate(w.startDate)} al ${this.formatDate(w.endDate)}`,
      shortDateRange: `${this.formatDate(w.startDate, true)} - ${this.formatDate(w.endDate, true)}`,
      startDate: w.startDate
    }));
  }

  selectWeekForDetail(startDate: string) {
    this.selectedWeekStart.set(startDate);
    this.detailBranchId.set(this.selectedBranchId);
    this.viewMode.set('detailed');
    this.loadDetailedConsolidation();
  }

  loadDetailedConsolidation() {
    const startDate = this.selectedWeekStart();
    if (!startDate) return;

    this.loadingDetail.set(true);
    const branchId = this.detailBranchId();

    if (this.detailTab() === 'products') {
      this.reportsService.getProductsWeeklyConsolidation(startDate, branchId).subscribe({
        next: (res) => {
          this.productsConsolidation.set(res.data.data);
          this.detailPeriod.set(res.data.period);
          this.loadingDetail.set(false);
        },
        error: () => this.loadingDetail.set(false)
      });
    } else {
      this.reportsService.getCustomersWeeklyConsolidation(startDate, branchId).subscribe({
        next: (res) => {
          this.customersConsolidation.set(res.data.data);
          this.detailPeriod.set(res.data.period);
          this.loadingDetail.set(false);
        },
        error: () => this.loadingDetail.set(false)
      });
    }
  }

  backToGeneralView() {
    this.viewMode.set('general');
    this.productsConsolidation.set([]);
    this.customersConsolidation.set([]);
    this.detailPeriod.set(null);
  }

  onDetailTabChange() {
    this.loadDetailedConsolidation();
  }

  getWeekData(branch: WeeklyConsolidationBranchDto, weekId: string) {
    return branch.weeks.find(w => w.week === weekId);
  }

  getWeekTrend(branch: WeeklyConsolidationBranchDto, currentWeekId: string) {
    const week = branch.weeks.find(w => w.week === currentWeekId);
    return week?.trend || null;
  }

  getSelectedBranchName(): string {
    const branchId = this.detailBranchId();
    if (!branchId) return 'Consolidado General';
    return this.branches.find(b => b.id === branchId)?.name || 'Sucursal desconocida';
  }

  getSelectedWeekDateRange(): string {
    const startDate = this.selectedWeekStart();
    if (!startDate) return '';
    const week = this.weeklyWeeks.find(w => w.startDate === startDate);
    return week ? week.dateRange : '';
  }

  formatDate(dateStr: string | undefined, short: boolean = false): string {
    if (!dateStr) return '';
    // Handle both YYYY-MM-DD and YYYY-MM-DDT00:00:00.000Z
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return short ? `${day}/${month}` : `${day}/${month}/${year}`;
  }

  printConsolidation() {
    window.print();
  }

  // --- Chart Updates ---

  private updateHourlySalesChart(data: HourlySalesDataDto[]) {
    this.hourlySalesData = {
      labels: data.map((d) => d.hour),
      datasets: [
        {
          label: 'Ventas (Q)',
          data: data.map((d) => d.total),
          fill: true,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.05)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#4f46e5',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#4f46e5',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  }

  private updatePaymentChart(paymentStatus: PaymentStatusSummaryDto) {
    const totalCount = paymentStatus.paid.count + paymentStatus.pending.count + paymentStatus.overdue.count;
    
    // We use percentages for the bars to maintain the "Radial" look proportions
    // but we will show the real counts in the legend as per user's example
    const series = totalCount > 0 ? [
      Math.round((paymentStatus.paid.count / totalCount) * 100),
      Math.round((paymentStatus.pending.count / totalCount) * 100),
      Math.round((paymentStatus.overdue.count / totalCount) * 100)
    ] : [0, 0, 0];

    this.paymentApexChart = {
      series: series,
      chart: {
        height: 600,
        type: "radialBar"
      },
      plotOptions: {
        radialBar: {
          offsetY: 0,
          startAngle: 0,
          endAngle: 270,
          hollow: {
            margin: 5,
            size: "50%",
            background: "transparent",
            image: undefined
          },
          dataLabels: {
            name: {
              show: false
            },
            value: {
              show: false
            }
          }
        }
      },
      colors: ['#10b981', '#f59e0b', '#ef4444'],
      labels: ['Pagado', 'Pendiente', 'Vencido'],
      legend: {
        show: true,
        floating: true,
        fontSize: "12px",
        position: "left",
        offsetX: 20,
        offsetY: 5,
        labels: {
          useSeriesColors: true
        },
        markers: {
          size: 0
        },
        formatter: (seriesName: string, opts: any) => {
          // Find the corresponding count for the legend
          let count = 0;
          if (this.reportData?.paymentStatus) {
            if (opts.seriesIndex === 0) count = this.reportData.paymentStatus.paid.count;
            if (opts.seriesIndex === 1) count = this.reportData.paymentStatus.pending.count;
            if (opts.seriesIndex === 2) count = this.reportData.paymentStatus.overdue.count;
          }
          return seriesName + ":  " + count;
        },
        itemMargin: {
          horizontal: 3,
          vertical: 1
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              show: false
            }
          }
        }
      ],
      // We keep the custom tooltip for the amounts (Q)
      tooltip: {
        enabled: true,
        custom: ({ seriesIndex, w }: any) => {
          const label = w.config.labels[seriesIndex];
          let count = 0;
          let amount = 0;
          
          if (this.reportData?.paymentStatus) {
            if (seriesIndex === 0) {
              count = this.reportData.paymentStatus.paid.count;
              amount = this.reportData.paymentStatus.paid.amount;
            } else if (seriesIndex === 1) {
              count = this.reportData.paymentStatus.pending.count;
              amount = this.reportData.paymentStatus.pending.amount;
            } else if (seriesIndex === 2) {
              count = this.reportData.paymentStatus.overdue.count;
              amount = this.reportData.paymentStatus.overdue.amount;
            }
          }
          
          return `<div class="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-2xl">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black uppercase tracking-widest">${label}</span>
            </div>
            <div class="text-sm font-black mb-0.5">${count} facturas</div>
            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total: Q ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>`;
        }
      }
    };
  }

  private initChartOptions() {
    let textColorSecondary = '#64748b';
    let surfaceBorder = '#f1f5f9';

    this.hourlySalesOptions = {
        maintainAspectRatio: false,
        aspectRatio: 0.8,
        plugins: {
            legend: { display: false },
            tooltip: { 
              backgroundColor: '#1e293b', 
              padding: 12,
              displayColors: false,
              titleFont: { size: 13, weight: 'bold' },
              bodyFont: { size: 12 },
              callbacks: {
                label: (context: any) => `Total: Q ${context.raw.toLocaleString()}`
              }
            }
        },
        scales: {
            x: { 
              ticks: { color: textColorSecondary, font: { size: 11 } }, 
              grid: { display: false } 
            },
            y: { 
              min: 0,
              ticks: { 
                color: textColorSecondary, 
                font: { size: 11 },
                callback: (value: any) => 'Q ' + value
              }, 
              grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] } 
            }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
    };
  }

  goToCash() {
    this.router.navigate(['/sales/cash-register']);
  }
}
