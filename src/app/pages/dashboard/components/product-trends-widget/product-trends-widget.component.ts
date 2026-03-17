import { Component, Input, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ReportsService } from '../../../../core/services/reports.service';
import { ProductMonthlyTrendDto } from '../../../../core/models/reports.models';
import { BranchesService } from '../../../../inventory/services/branches.service';
import { Branch } from '../../../../inventory/interfaces/branch.interface';
import { AuthService } from '../../../../auth/auth.service';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { 
  ApexAxisChartSeries, 
  ApexChart, 
  ApexXAxis, 
  ApexDataLabels, 
  ApexStroke, 
  ApexYAxis, 
  ApexTitleSubtitle, 
  ApexLegend,
  ApexTooltip,
  ApexGrid 
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  subtitle: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
};

@Component({
  selector: 'app-product-trends-widget',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, ButtonModule, SelectModule, FormsModule, TooltipModule],
  templateUrl: './product-trends-widget.component.html',
  styleUrl: './product-trends-widget.component.css'
})
export class ProductTrendsWidgetComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);

  chartOptions = signal<Partial<ChartOptions>>({});
  isLoading = signal<boolean>(false);
  isLoadingBranches = signal<boolean>(false);
  branchesArr = signal<Branch[]>([]);
  
  // Filters
  selectedMonth = signal<number>(new Date().getMonth() + 1);
  selectedYear = signal<number>(new Date().getFullYear());
  selectedBranchId = signal<string | null>(null);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);

  get canFilterByBranch(): boolean {
    const user = this.authService.currentUser;
    return user?.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  months = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 }
  ];

  years: any[] = [];

  constructor() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 3; i--) {
      this.years.push({ label: i.toString(), value: i });
    }

    effect(() => {
      this.loadData(this.selectedBranchId());
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initChartOptions();
    if (this.canFilterByBranch) {
      this.loadBranches();
    }
  }

  loadBranches() {
    this.isLoadingBranches.set(true);
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        this.branchesArr.set(res.data);
        this.isLoadingBranches.set(false);
      },
      error: () => this.isLoadingBranches.set(false)
    });
  }

  initChartOptions() {
    this.chartOptions.set({
      series: [],
      chart: {
        height: 350,
        type: "line",
        zoom: {
          enabled: false
        },
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 800,
        } as any
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: [4, 4, 4, 4, 4],
        curve: "smooth",
        dashArray: [0, 0, 0, 0, 0]
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        fontWeight: 600,
        markers: {
          width: 12,
          height: 12,
          radius: 12,
        } as any,
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        row: {
          colors: ["#f8fafc", "transparent"],
          opacity: 0.5
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '10px'
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          formatter: (value) => `Q ${value.toFixed(2)}`,
          style: {
            colors: '#64748b',
            fontSize: '10px'
          }
        }
      },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      tooltip: {
        theme: 'light',
        y: {
          formatter: (value) => `Q ${value.toFixed(2)}`
        }
      }
    });
  }

  loadData(branchId?: string | null) {
    this.isLoading.set(true);
    this.reportsService.getProductMonthlyTrends(
      this.selectedMonth(),
      this.selectedYear(),
      branchId || undefined,
      this.currentPage(),
      5
    ).subscribe({
      next: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.updateChart(res.data);
          this.totalPages.set(res.data.pagination.totalPages);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  updateChart(data: ProductMonthlyTrendDto) {
    this.chartOptions.update(prev => ({
      ...prev,
      series: data.series,
      xaxis: {
        ...prev.xaxis,
        categories: data.categories
      }
    }));
  }

  onMonthChange() {
    this.currentPage.set(1);
    this.loadData(this.selectedBranchId());
  }

  onYearChange() {
    this.currentPage.set(1);
    this.loadData(this.selectedBranchId());
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData(this.selectedBranchId());
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData(this.selectedBranchId());
    }
  }
}
