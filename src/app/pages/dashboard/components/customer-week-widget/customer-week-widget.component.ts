import { Component, computed, effect, ElementRef, HostListener, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { DatePickerModule } from 'primeng/datepicker';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ReportsService } from '../../../../core/services/reports.service';
import { DashboardFilterService } from '../../dashboard-filter.service';
import {
  CustomerWeeklyItemDto,
  CustomerWeeklyKpisDto,
  CustomerWeeklySummaryDto,
} from '../../../../core/models/reports.models';

type AudienceFilter = 'all' | 'registered' | 'guest';

const GUEST_KEY = '__guest__';

@Component({
  selector: 'app-customer-week-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule,
    DatePickerModule,
    SearchInputComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './customer-week-widget.component.html',
  styleUrl: './customer-week-widget.component.css',
})
export class CustomerWeekWidgetComponent {
  private reportsService = inject(ReportsService);
  private dashboardFilter = inject(DashboardFilterService);
  private host = inject(ElementRef<HTMLElement>);

  weekStart = signal<Date>(this.toMonday(new Date()));
  calOpen = signal(false);
  search = signal('');
  audience = signal<AudienceFilter>('all');
  selectedId = signal<string | null>(null);
  customers = signal<CustomerWeeklyItemDto[]>([]);
  period = signal<{ start: string; end: string } | null>(null);
  serverKpis = signal<CustomerWeeklyKpisDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  weekNumber = computed(() => {
    const start = this.period()?.start;
    if (start) return this.isoWeek(this.parseIsoDate(start));
    return this.isoWeek(this.weekStart());
  });

  weekRangeLabel = computed(() => {
    const period = this.period();
    if (period) {
      return `${this.formatIsoDate(period.start)} al ${this.formatIsoDate(period.end)}`;
    }
    const end = new Date(this.weekStart());
    end.setDate(end.getDate() + 6);
    return `${this.formatDate(this.weekStart())} al ${this.formatDate(end)}`;
  });

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const audience = this.audience();
    return this.customers().filter((c) => {
      if (audience === 'registered' && c.isGuest) return false;
      if (audience === 'guest' && !c.isGuest) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.category.name.toLowerCase().includes(q) ||
        (c.topProduct?.name.toLowerCase().includes(q) ?? false)
      );
    });
  });

  emptySlots = computed(() => {
    const used = this.filtered().length === 0 ? 1 : this.filtered().length;
    return Array.from({ length: Math.max(0, 5 - used) }, (_, i) => i);
  });

  kpis = computed(() => {
    const fromApi = this.serverKpis();
    return {
      topName: fromApi?.topCustomer?.name ?? '—',
      topTotal: fromApi?.topCustomer?.total ?? 0,
      averageTicket: fromApi?.averageTicket ?? 0,
      concentration: fromApi?.top5Concentration ?? 0,
      pending: fromApi?.pendingAmount ?? 0,
      customerCount: fromApi?.activeCustomerCount ?? 0,
    };
  });

  selected = computed(() => {
    const key = this.selectedId();
    if (key == null) return null;
    return this.customers().find((c) => this.rowKey(c) === key) ?? null;
  });

  sparkMax = computed(() => {
    const c = this.selected();
    if (!c) return 1;
    return Math.max(...c.days.map((d) => d.total), 1);
  });

  constructor() {
    effect(() => {
      this.dashboardFilter.branchId();
      untracked(() => this.loadSummary());
    });
  }

  loadSummary() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.selectedId.set(null);

    this.reportsService.getCustomersWeeklySummary(this.toIsoDate(this.weekStart()), this.dashboardFilter.branchId()).subscribe({
      next: (res) => {
        const data: CustomerWeeklySummaryDto = res.data;
        this.period.set(data.period);
        this.serverKpis.set(data.kpis);
        this.customers.set(data.customers ?? []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.customers.set([]);
        this.serverKpis.set(null);
        this.errorMessage.set(this.readError(err));
        this.isLoading.set(false);
      },
    });
  }

  shiftWeek(delta: number) {
    const next = new Date(this.weekStart());
    next.setDate(next.getDate() + delta * 7);
    this.weekStart.set(next);
    this.loadSummary();
  }

  toggleCal(event: Event): void {
    event.stopPropagation();
    this.calOpen.update((open) => !open);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.calOpen()) return;
    const anchor = this.host.nativeElement.querySelector('.week-cal-anchor');
    if (anchor?.contains(event.target as Node)) return;
    this.calOpen.set(false);
  }

  onPickDate(date: Date | null) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    this.weekStart.set(this.toMonday(date));
    this.calOpen.set(false);
    this.loadSummary();
  }

  categorySeverity(name: string): string {
    switch (name) {
      case 'Mayorista':
        return 'burgundy';
      case 'Restaurante':
        return 'warn';
      case 'Hotel':
        return 'purple';
      case 'Minorista':
        return 'info';
      case 'Eventos':
        return 'success';
      default:
        return 'secondary';
    }
  }

  paidPercent(c: CustomerWeeklyItemDto): number {
    if (!c.total) return 0;
    return Math.min(100, Math.round((c.paidAmount / c.total) * 100));
  }

  creditPercent(c: CustomerWeeklyItemDto): number {
    if (!c.creditLimit) return 0;
    return Math.min(100, Math.round((c.creditUsed / c.creditLimit) * 100));
  }

  barHeight(total: number): number {
    return Math.round((total / this.sparkMax()) * 100);
  }

  dayTooltip(total: number): string {
    if (!total) return 'Sin ventas';
    return `Q ${total.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  dayAmountLabel(total: number): string {
    if (!total) return '—';
    return `Q${total.toLocaleString('es-GT', { maximumFractionDigits: 0 })}`;
  }

  rowKey(c: CustomerWeeklyItemDto): string {
    return c.id ?? GUEST_KEY;
  }

  selectCustomer(c: CustomerWeeklyItemDto) {
    this.selectedId.set(this.rowKey(c));
  }

  closeDetail() {
    this.selectedId.set(null);
  }

  setAudience(value: AudienceFilter) {
    this.audience.set(value);
  }

  formatIsoDate(value: string): string {
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  private toMonday(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return d;
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseIsoDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    return this.toIsoDate(date).split('-').reverse().join('/');
  }

  private isoWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private readError(err: any): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return 'No se pudo cargar el consolidado semanal.';
  }
}
