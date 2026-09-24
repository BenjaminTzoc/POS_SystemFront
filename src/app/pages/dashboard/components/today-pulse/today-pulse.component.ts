import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { ReportsService } from '../../../../core/services/reports.service';
import { TodayPulseDto } from '../../../../core/models/reports.models';
import { DashboardFilterService } from '../../dashboard-filter.service';

const REFRESH_MS = 45_000;

@Component({
  selector: 'app-today-pulse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './today-pulse.component.html',
  styleUrl: './today-pulse.component.css',
})
export class TodayPulseComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private destroyRef = inject(DestroyRef);
  private dashboardFilter = inject(DashboardFilterService);
  private router = inject(Router);

  data = signal<TodayPulseDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  sales = computed(() => this.data()?.sales ?? null);
  pending = computed(() => this.data()?.pending ?? null);
  receivable = computed(() => this.data()?.receivable ?? null);
  attention = computed(() => this.data()?.attention ?? null);

  salesTrend = computed(() => {
    const change = this.sales()?.changePercent ?? 0;
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'flat';
  });

  salesDelta = computed(() => {
    const sales = this.sales();
    if (!sales) return 0;
    return sales.total - (sales.previousTotal || 0);
  });

  constructor() {
    effect(() => {
      this.dashboardFilter.branchId();
      untracked(() => this.loadPulse());
    });
  }

  ngOnInit(): void {
    interval(REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'visible') this.loadPulse(true);
      });
  }

  loadPulse(silent = false) {
    if (!silent) this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reportsService.getTodayPulse(this.dashboardFilter.branchId()).subscribe({
      next: (res) => {
        this.data.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        if (!silent) {
          this.data.set(null);
          this.errorMessage.set(this.readError(err));
        }
        this.isLoading.set(false);
      },
    });
  }

  openSale(saleId: string | null | undefined): void {
    if (!saleId) return;
    this.router.navigate(['/sales/new-order'], { queryParams: { id: saleId } });
  }

  stockLabel(item: { quantity: number; unit: string }): string {
    const qty = Number.isInteger(item.quantity)
      ? String(item.quantity)
      : item.quantity.toLocaleString('es-GT', { maximumFractionDigits: 2 });
    return `${qty} ${item.unit}`.trim();
  }

  formatWait(minutes: number | null | undefined): string {
    if (minutes == null || minutes < 0) return '';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours < 24) {
      return remMin ? `${hours} h ${remMin} min` : `${hours} h`;
    }

    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    if (days < 7) {
      return remHours ? `${days} d ${remHours} h` : `${days} d`;
    }

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (weeks < 8) {
      return remainingDays ? `${weeks} sem ${remainingDays} d` : `${weeks} sem`;
    }

    return `${days} d`;
  }

  private readError(err: any): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return 'No se pudo cargar el pulso de hoy.';
  }
}
