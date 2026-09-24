import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ReportsService } from '../../../../core/services/reports.service';
import { TodayPaymentItemDto, TodayPaymentsDto, TodayPaymentsSummaryDto } from '../../../../core/models/reports.models';
import { DashboardFilterService } from '../../dashboard-filter.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

const REFRESH_MS = 45_000;
const EMPTY_SUMMARY: TodayPaymentsSummaryDto = {
  total: 0,
  count: 0,
  cash: 0,
  transfer: 0,
  other: 0,
  settled: 0,
};

@Component({
  selector: 'app-today-payments',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './today-payments.component.html',
  styleUrl: './today-payments.component.css',
})
export class TodayPaymentsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  private dashboardFilter = inject(DashboardFilterService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  data = signal<TodayPaymentsDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  summary = computed(() => this.data()?.summary ?? EMPTY_SUMMARY);
  payments = computed(() => this.data()?.payments ?? []);

  constructor() {
    effect(() => {
      this.dashboardFilter.branchId();
      untracked(() => this.loadPayments());
    });
  }

  ngOnInit(): void {
    interval(REFRESH_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'visible') this.loadPayments(true);
      });
  }

  loadPayments(silent = false) {
    if (!silent) this.isLoading.set(true);
    this.errorMessage.set(null);
    this.reportsService.getTodayPayments(this.dashboardFilter.branchId()).subscribe({
      next: (res) => {
        this.data.set(res.data ?? null);
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

  openPayment(row: TodayPaymentItemDto) {
    if (!row.saleId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin identificador',
        detail: `No se puede abrir la factura #${row.invoiceNumber}.`,
      });
      return;
    }
    this.router.navigate(['/sales/new-order'], { queryParams: { id: row.saleId } });
  }

  private readError(err: any): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return 'No se pudieron cargar los abonos de hoy.';
  }
}
