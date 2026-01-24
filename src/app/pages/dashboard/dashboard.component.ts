import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ReportsService } from '../../core/services/reports.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { Router } from '@angular/router';
import {
  DashboardSummaryDto,
  SalesTrendDto,
  TopSellingProductDto,
  CategoryDistributionDto,
  PaymentMethodStatDto,
  HourlySalesDto,
  WeekdaySalesDto,
  InventoryMovementReportDto,
  ProfitReportDto,
} from '../../core/models/reports.models';

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
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummaryDto | null = null;
  topProducts: TopSellingProductDto[] = [];

  // Charts Data
  salesTrendData: any;
  salesTrendOptions: any;

  categoriesData: any;
  categoriesOptions: any;

  paymentMethodsData: any;
  paymentMethodsOptions: any;

  topProductsData: any;
  topProductsOptions: any;

  // Filters
  dateRange: Date[] | undefined;
  branches: Branch[] = [];
  selectedBranchId: string | undefined;

  // Cash Session Status
  currentCashSession = signal<CashSession | null>(null);

  // Loading states
  isLoadingSummary = false;
  isLoadingTrends = false;
  isLoadingTopProducts = false;
  isLoadingCategories = false;
  isLoadingPaymentMethods = false;
  isLoadingBranches = false;
  isLoadingHourly = false;
  isLoadingWeekday = false;
  isLoadingMovements = false;
  isLoadingProfit = false;

  // New Charts Data
  hourlySalesData: any;
  hourlySalesOptions: any;

  weekdaySalesData: any;
  weekdaySalesOptions: any;

  inventoryMovementsData: any;
  inventoryMovementsOptions: any;

  profitData: any;
  profitOptions: any;

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
    this.initChartOptions();
  }

  ngOnInit(): void {
    if (this.canFilterByBranch) {
      this.loadBranches();
    }
    this.loadAllData();
    this.checkCashStatus();
  }

  private checkCashStatus() {
    this.cashService.getStatus().subscribe({
      next: (res) => this.currentCashSession.set(res.data),
    });
  }

  goToCash() {
    this.router.navigate(['/sales/cash-register']);
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

  loadAllData() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    this.loadSummary();
    this.loadSalesTrends(startDate, endDate);
    this.loadTopProducts(startDate, endDate);
    this.loadCategories();
    this.loadPaymentMethods(startDate, endDate);
    this.loadHourlySales(startDate, endDate);
    this.loadWeekdaySales(startDate, endDate);
    this.loadInventoryMovements();
    this.loadProfitReport();
  }

  onFilterChange() {
    this.loadAllData();
  }

  private getStartDate(): string | undefined {
    return this.dateRange && this.dateRange[0] ? this.dateRange[0].toISOString() : undefined;
  }

  private getEndDate(): string | undefined {
    return this.dateRange && this.dateRange[1] ? this.dateRange[1].toISOString() : undefined;
  }

  private loadSummary() {
    this.isLoadingSummary = true;
    this.reportsService.getDashboardSummary(this.selectedBranchId).subscribe({
      next: (res) => {
        this.summary = res.data;
        this.isLoadingSummary = false;
      },
      error: (err) => {
        console.error('Error loading summary', err);
        this.isLoadingSummary = false;
      },
    });
  }

  private loadSalesTrends(startDate?: string, endDate?: string) {
    this.isLoadingTrends = true;
    this.reportsService.getSalesTrends(7, startDate, endDate, this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateSalesTrendChart(res.data);
        this.isLoadingTrends = false;
      },
      error: (err) => {
        console.error('Error loading sales trends', err);
        this.isLoadingTrends = false;
      },
    });
  }

  private updateSalesTrendChart(data: SalesTrendDto[]) {
    this.salesTrendData = {
      labels: data.map((d) => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Ventas (Q)',
          data: data.map((d) => d.total),
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Ordenes',
          data: data.map((d) => d.orderCount || 0),
          fill: false,
          borderColor: '#94a3b8',
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  }

  private loadTopProducts(startDate?: string, endDate?: string) {
    this.isLoadingTopProducts = true;
    this.reportsService
      .getTopSellingProducts(5, startDate, endDate, this.selectedBranchId)
      .subscribe({
        next: (res) => {
          this.topProducts = res.data;
          this.updateTopProductsChart(res.data);
          this.isLoadingTopProducts = false;
        },
        error: (err) => {
          console.error('Error loading top products', err);
          this.isLoadingTopProducts = false;
        },
      });
  }

  private loadCategories() {
    this.isLoadingCategories = true;
    this.reportsService.getCategoriesDistribution(this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateCategoriesChart(res.data);
        this.isLoadingCategories = false;
      },
      error: (err) => {
        console.error('Error loading categories', err);
        this.isLoadingCategories = false;
      },
    });
  }

  private updateCategoriesChart(data: CategoryDistributionDto[]) {
    this.categoriesData = {
      labels: data.map((d) => d.category),
      datasets: [
        {
          data: data.map((d) => d.productCount),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0,
        },
      ],
    };
  }

  private loadPaymentMethods(startDate?: string, endDate?: string) {
    this.isLoadingPaymentMethods = true;
    this.reportsService
      .getPaymentMethodsStats(startDate, endDate, this.selectedBranchId)
      .subscribe({
        next: (res) => {
          this.updatePaymentMethodsChart(res.data);
          this.isLoadingPaymentMethods = false;
        },
        error: (err) => {
          console.error('Error loading payment methods', err);
          this.isLoadingPaymentMethods = false;
        },
      });
  }

  private updatePaymentMethodsChart(data: PaymentMethodStatDto[]) {
    this.paymentMethodsData = {
      labels: data.map((d) => d.method),
      datasets: [
        {
          data: data.map((d) => d.total),
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
          borderWidth: 0,
        },
      ],
    };
  }

  private updateTopProductsChart(data: TopSellingProductDto[]) {
    this.topProductsData = {
      labels: data.map((d) => d.productName),
      datasets: [
        {
          label: 'Cantidad Vendida',
          data: data.map((d) => d.quantity),
          backgroundColor: '#6366f1',
          borderRadius: 8,
        },
      ],
    };
  }

  private loadHourlySales(startDate?: string, endDate?: string) {
    this.isLoadingHourly = true;
    this.reportsService.getHourlySales(startDate, endDate, this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateHourlySalesChart(res.data);
        this.isLoadingHourly = false;
      },
      error: (err) => {
        console.error('Error loading hourly sales', err);
        this.isLoadingHourly = false;
      },
    });
  }

  private updateHourlySalesChart(data: HourlySalesDto[]) {
    this.hourlySalesData = {
      labels: data.map((d) => `${d.hour}:00`),
      datasets: [
        {
          label: 'Ventas (Q)',
          data: data.map((d) => d.total),
          fill: true,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        },
      ],
    };
  }

  private loadWeekdaySales(startDate?: string, endDate?: string) {
    this.isLoadingWeekday = true;
    this.reportsService.getWeekdaySales(startDate, endDate, this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateWeekdaySalesChart(res.data);
        this.isLoadingWeekday = false;
      },
      error: (err) => {
        console.error('Error loading weekday sales', err);
        this.isLoadingWeekday = false;
      },
    });
  }

  private updateWeekdaySalesChart(data: WeekdaySalesDto[]) {
    this.weekdaySalesData = {
      labels: data.map((d) => d.day),
      datasets: [
        {
          label: 'Ventas (Q)',
          data: data.map((d) => d.total),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        },
      ],
    };
  }

  private loadInventoryMovements() {
    this.isLoadingMovements = true;
    this.reportsService.getInventoryMovements(30, this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateInventoryMovementsChart(res.data);
        this.isLoadingMovements = false;
      },
      error: (err) => {
        console.error('Error loading inventory movements', err);
        this.isLoadingMovements = false;
      },
    });
  }

  private updateInventoryMovementsChart(data: InventoryMovementReportDto[]) {
    this.inventoryMovementsData = {
      labels: data.map((d) => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Entradas',
          data: data.map((d) => d.entries),
          backgroundColor: '#10b981',
          borderRadius: 4,
        },
        {
          label: 'Salidas',
          data: data.map((d) => d.exits),
          backgroundColor: '#ef4444',
          borderRadius: 4,
        },
      ],
    };
  }

  private loadProfitReport() {
    this.isLoadingProfit = true;
    this.reportsService.getProfitReport(30, this.selectedBranchId).subscribe({
      next: (res) => {
        this.updateProfitChart(res.data);
        this.isLoadingProfit = false;
      },
      error: (err) => {
        console.error('Error loading profit report', err);
        this.isLoadingProfit = false;
      },
    });
  }

  private updateProfitChart(data: ProfitReportDto[]) {
    this.profitData = {
      labels: data.map((d) => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Ingresos (Q)',
          data: data.map((d) => d.revenue),
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Egresos (Q)',
          data: data.map((d) => d.expenses),
          fill: true,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Utilidad (Q)',
          data: data.map((d) => d.profit),
          fill: false,
          borderColor: '#10b981',
          borderWidth: 3,
          tension: 0.4,
        },
      ],
    };
  }

  private initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.salesTrendOptions = {
      stacked: false,
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            drawOnChartArea: false,
            color: surfaceBorder,
          },
        },
      },
    };

    this.categoriesOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: textColor,
          },
        },
      },
    };

    this.paymentMethodsOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: textColor,
          },
        },
      },
    };

    this.topProductsOptions = {
      indexAxis: 'y',
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
            font: {
              weight: 500,
            },
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };

    this.hourlySalesOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };

    this.weekdaySalesOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };

    this.inventoryMovementsOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            usePointStyle: true,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            display: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };

    this.profitOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
          },
        },
      },
    };
  }
}
