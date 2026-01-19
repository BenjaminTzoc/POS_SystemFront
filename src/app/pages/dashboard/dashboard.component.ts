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
import {
  DashboardSummaryDto,
  SalesTrendDto,
  TopSellingProductDto,
  CategoryDistributionDto,
  PaymentMethodStatDto,
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
  selectedBranch: string | undefined; // For SuperAdmin

  // Loading states
  isLoadingSummary = false;
  isLoadingTrends = false;
  isLoadingTopProducts = false;
  isLoadingCategories = false;
  isLoadingPaymentMethods = false;

  constructor(private reportsService: ReportsService) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData() {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    this.loadSummary();
    this.loadSalesTrends(startDate, endDate);
    this.loadTopProducts(startDate, endDate);
    this.loadCategories();
    this.loadPaymentMethods(startDate, endDate);
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
    this.reportsService.getDashboardSummary(this.selectedBranch).subscribe({
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
    this.reportsService.getSalesTrends(7, startDate, endDate, this.selectedBranch).subscribe({
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
          label: 'Ventas ($)',
          data: data.map((d) => d.total),
          fill: false,
          borderColor: '#4bc0c0',
          tension: 0.4,
        },
        {
          label: 'Ordenes',
          data: data.map((d) => d.orderCount || 0),
          fill: false,
          borderColor: '#565656',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    };
  }

  private loadTopProducts(startDate?: string, endDate?: string) {
    this.isLoadingTopProducts = true;
    this.reportsService
      .getTopSellingProducts(5, startDate, endDate, this.selectedBranch)
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
    this.reportsService.getCategoriesDistribution(this.selectedBranch).subscribe({
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
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
  }

  private loadPaymentMethods(startDate?: string, endDate?: string) {
    this.isLoadingPaymentMethods = true;
    this.reportsService.getPaymentMethodsStats(startDate, endDate, this.selectedBranch).subscribe({
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
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
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
          backgroundColor: '#42A5F5',
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
  }
}
