import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ReportsService } from '../../../../core/services/reports.service';
import { CalendarEventDto, CalendarOrderDto, DashboardCalendarDto } from '../../../../core/models/reports.models';
import { OrdersService } from '../../../../sales/services/orders.service';
import { DashboardFilterService } from '../../dashboard-filter.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

const REMINDER_COOLDOWN_MS = 4 * 60 * 60 * 1000;

@Component({
  selector: 'app-collections-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerModule, TooltipModule, StatusBadgeComponent],
  templateUrl: './collections-calendar.component.html',
  styleUrl: './collections-calendar.component.css',
})
export class CollectionsCalendarComponent {
  private reportsService = inject(ReportsService);
  private ordersService = inject(OrdersService);
  private dashboardFilter = inject(DashboardFilterService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  ordersByDate = signal<Record<string, CalendarOrderDto[]>>({});
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  remindingSaleId = signal<string | null>(null);
  viewMonth = signal<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  selectedDate = signal<Date>(new Date());

  selectedKey = computed(() => this.toKey(this.selectedDate()));

  selectedOrders = computed(() => this.ordersByDate()[this.selectedKey()] ?? []);

  selectedTotals = computed(() => {
    const orders = this.selectedOrders();
    return {
      count: orders.length,
      pending: orders.reduce((sum, o) => sum + (o.pendingAmount || 0), 0),
    };
  });

  selectedLabel = computed(() => this.formatLong(this.selectedDate()));

  kpis = computed(() => {
    const todayKey = this.toKey(new Date());
    const weekKeys = this.currentWeekKeys();
    let monthPending = 0;
    let monthOverdue = 0;
    let dueToday = 0;
    let dueWeek = 0;

    for (const [key, orders] of Object.entries(this.ordersByDate())) {
      const pending = orders.reduce((sum, o) => sum + (o.pendingAmount || 0), 0);
      const overdue = orders
        .filter((o) => this.isOverdue(o))
        .reduce((sum, o) => sum + (o.pendingAmount || 0), 0);
      monthPending += pending;
      monthOverdue += overdue;
      if (key === todayKey) dueToday += pending;
      if (weekKeys.has(key)) dueWeek += pending;
    }

    return { monthPending, monthOverdue, dueToday, dueWeek };
  });

  constructor() {
    effect(() => {
      this.dashboardFilter.branchId();
      untracked(() => this.loadCalendar());
    });
  }

  loadCalendar() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const month = this.viewMonth();
    this.reportsService
      .getDashboardCalendar(month.getMonth() + 1, month.getFullYear(), this.dashboardFilter.branchId())
      .subscribe({
        next: (res) => {
          this.ordersByDate.set(this.indexByDate(res.data ?? {}));
          this.isLoading.set(false);
        },
        error: (err) => {
          this.ordersByDate.set({});
          this.errorMessage.set(this.readError(err, 'No se pudo cargar el calendario de cobros.'));
          this.isLoading.set(false);
        },
      });
  }

  onMonthChange(event: { month?: number; year?: number }) {
    if (event.month === undefined || event.year === undefined) return;
    const next = new Date(event.year, event.month - 1, 1);
    this.viewMonth.set(next);
    const today = new Date();
    if (today.getFullYear() === next.getFullYear() && today.getMonth() === next.getMonth()) {
      this.selectedDate.set(today);
    } else {
      this.selectedDate.set(next);
    }
    this.loadCalendar();
  }

  onDateSelect(date: Date | null) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return;
    this.selectedDate.set(date);
  }

  dayInfo(date: { year: number; month: number; day: number }) {
    const key = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    const orders = this.ordersByDate()[key] ?? [];
    const pending = orders.reduce((sum, o) => sum + (o.pendingAmount || 0), 0);
    const overdue = orders.some((o) => this.isOverdue(o));
    return { key, pending, overdue, count: orders.length };
  }

  isToday(date: { year: number; month: number; day: number }) {
    const today = new Date();
    return date.year === today.getFullYear() && date.month === today.getMonth() && date.day === today.getDate();
  }

  dayTooltip(info: { pending: number; overdue: boolean; count: number }) {
    if (!info.count) return '';
    const estado = info.overdue ? ' · hay vencido' : '';
    return `${info.count} factura${info.count === 1 ? '' : 's'} · ${this.formatMoney(info.pending)}${estado}`;
  }

  compactAmount(value: number): string {
    if (!value) return '';
    if (value >= 10000) return `Q${Math.round(value / 1000)}k`;
    if (value >= 1000) return `Q${(value / 1000).toFixed(1)}k`;
    return `Q${Math.round(value)}`;
  }

  paidPercent(order: CalendarOrderDto): number {
    if (!order.total) return 0;
    const paid = this.paidAmount(order);
    return Math.min(100, Math.round((paid / order.total) * 100));
  }

  paidAmount(order: CalendarOrderDto): number {
    if (order.paidAmount != null) return Number(order.paidAmount);
    return Math.max(0, Number(order.total || 0) - Number(order.pendingAmount || 0));
  }

  isOverdue(order: CalendarOrderDto): boolean {
    if (order.isOverdue) return true;
    return this.daysUntilDue(order) < 0 && Number(order.pendingAmount || 0) > 0;
  }

  dueTone(order: CalendarOrderDto): 'danger' | 'warn' | 'info' {
    const days = this.daysUntilDue(order);
    if (days < 0 || order.isOverdue) return 'danger';
    if (days === 0) return 'warn';
    return 'info';
  }

  dueLabel(order: CalendarOrderDto): string {
    const days = this.daysUntilDue(order);
    if (order.isOverdue || days < 0) {
      return days < 0 ? `Vencido ${Math.abs(days)}d` : 'Vencido';
    }
    if (days === 0) return 'Vence hoy';
    return `En ${days}d`;
  }

  windowLabel(order: CalendarOrderDto): string {
    const due = this.civilDate(order.dueDate);
    const start = this.civilDate(order.billingStartDate);
    if (start && due) return `${this.shortDate(start)} → ${this.shortDate(due)}`;
    if (due) return `Límite ${this.shortDate(due)}`;
    return 'Sin ventana de cobro';
  }

  lastPaymentLabel(order: CalendarOrderDto): string | null {
    const date = this.civilDate(order.lastPaymentDate);
    if (!date || order.lastPaymentAmount == null) return null;
    return `Último abono ${this.shortDate(date)} · ${this.formatMoney(order.lastPaymentAmount)}`;
  }

  remindLabel(order: CalendarOrderDto): string | null {
    if (!order.lastRemindedAt) return null;
    const sent = new Date(order.lastRemindedAt);
    if (Number.isNaN(sent.getTime())) return null;
    const ago = Date.now() - sent.getTime();
    if (ago < 60_000) return 'Recordado ahora';
    if (ago < 3_600_000) return `Recordado hace ${Math.max(1, Math.round(ago / 60_000))} min`;
    if (ago < 86_400_000) return `Recordado hace ${Math.max(1, Math.round(ago / 3_600_000))} h`;
    return `Recordado ${sent.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' })}`;
  }

  canRemind(order: CalendarOrderDto): boolean {
    if (!order.phone || !this.saleId(order)) return false;
    if (this.remindingSaleId() === this.saleId(order)) return false;
    return !this.inCooldown(order);
  }

  remindTooltip(order: CalendarOrderDto): string {
    if (!order.phone) return 'Sin teléfono';
    if (this.inCooldown(order)) return 'Ya se envió un recordatorio hace poco';
    return 'Enviar recordatorio';
  }

  openOrder(order: CalendarOrderDto) {
    const id = this.saleId(order);
    if (!id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin identificador',
        detail: `No se puede abrir la factura #${order.invoiceNumber}.`,
      });
      return;
    }
    this.router.navigate(['/sales/new-order'], { queryParams: { id } });
  }

  remind(event: Event, order: CalendarOrderDto) {
    event.stopPropagation();
    const saleId = this.saleId(order);
    if (!saleId) return;
    if (!order.phone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin teléfono',
        detail: `${order.customerName} no tiene número registrado.`,
      });
      return;
    }
    if (this.inCooldown(order)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Espera un momento',
        detail: 'Ya se envió un recordatorio hace poco.',
      });
      return;
    }

    this.remindingSaleId.set(saleId);
    this.ordersService.sendCollectionReminder(saleId).subscribe({
      next: (res) => {
        const at = res.data?.lastRemindedAt || res.data?.sentAt || new Date().toISOString();
        this.patchReminded(saleId, at);
        this.remindingSaleId.set(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Recordatorio enviado',
          detail: `Se avisó a ${order.customerName} por WhatsApp.`,
        });
      },
      error: (err) => {
        const status = err?.status ?? err?.error?.statusCode;
        const lastAt = err?.error?.data?.lastRemindedAt as string | undefined;
        if (status === 409 && lastAt) this.patchReminded(saleId, lastAt);
        this.remindingSaleId.set(null);
        this.messageService.add({
          severity: status === 409 ? 'warn' : 'error',
          summary: status === 409 ? 'Ya enviado' : 'No se envió',
          detail: this.readError(err, 'No se pudo enviar el recordatorio.'),
        });
      },
    });
  }

  call(event: Event, order: CalendarOrderDto) {
    event.stopPropagation();
    if (!order.phone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin teléfono',
        detail: `${order.customerName} no tiene número registrado.`,
      });
      return;
    }
    window.open(`tel:+502${this.digits(order.phone)}`, '_self');
  }

  registerPayment(event: Event, order: CalendarOrderDto) {
    event.stopPropagation();
    this.openOrder(order);
  }

  isReminding(order: CalendarOrderDto): boolean {
    return this.remindingSaleId() === this.saleId(order);
  }

  private inCooldown(order: CalendarOrderDto): boolean {
    if (!order.lastRemindedAt) return false;
    const sent = new Date(order.lastRemindedAt).getTime();
    if (Number.isNaN(sent)) return false;
    return Date.now() - sent < REMINDER_COOLDOWN_MS;
  }

  private patchReminded(saleId: string, lastRemindedAt: string) {
    this.ordersByDate.update((map) => {
      const next: Record<string, CalendarOrderDto[]> = {};
      for (const [key, orders] of Object.entries(map)) {
        next[key] = orders.map((order) =>
          this.saleId(order) === saleId ? { ...order, lastRemindedAt } : order,
        );
      }
      return next;
    });
  }

  private indexByDate(data: DashboardCalendarDto): Record<string, CalendarOrderDto[]> {
    const grouped: Record<string, CalendarOrderDto[]> = {};
    for (const [key, events] of Object.entries(data || {})) {
      grouped[key] = this.flatten(events);
    }
    return grouped;
  }

  private flatten(events: CalendarEventDto[]): CalendarOrderDto[] {
    const seen = new Set<string>();
    const list: CalendarOrderDto[] = [];
    for (const event of events ?? []) {
      for (const raw of event.orders ?? []) {
        const order = this.normalize(raw);
        const id = this.saleId(order) || order.invoiceNumber;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        list.push(order);
      }
    }
    return list.sort((a, b) => {
      const overdue = Number(this.isOverdue(b)) - Number(this.isOverdue(a));
      if (overdue) return overdue;
      const pending = (b.pendingAmount || 0) - (a.pendingAmount || 0);
      if (pending) return pending;
      return (a.invoiceNumber || '').localeCompare(b.invoiceNumber || '');
    });
  }

  private normalize(raw: CalendarOrderDto): CalendarOrderDto {
    const total = Number(raw.total || 0);
    const pending = Number(raw.pendingAmount || 0);
    const paid = raw.paidAmount != null ? Number(raw.paidAmount) : Math.max(0, total - pending);
    return {
      ...raw,
      saleId: raw.saleId || raw.id || '',
      customerId: raw.customerId ?? null,
      phone: raw.phone?.trim() ? raw.phone.trim() : null,
      pendingAmount: pending,
      paidAmount: paid,
      total,
      billingStartDate: this.civilDate(raw.billingStartDate),
      dueDate: this.civilDate(raw.dueDate) || raw.dueDate,
      lastPaymentDate: this.civilDate(raw.lastPaymentDate),
      lastPaymentAmount: raw.lastPaymentAmount ?? null,
      lastRemindedAt: raw.lastRemindedAt ?? (raw as CalendarOrderDto & { collectionLastRemindedAt?: string }).collectionLastRemindedAt ?? null,
      branchName: raw.branchName || '',
      isPreorder: !!raw.isPreorder,
      delivered: !!raw.delivered,
      notes: raw.notes?.trim() ? raw.notes.trim() : null,
    };
  }

  private saleId(order: CalendarOrderDto): string {
    return order.saleId || order.id || '';
  }

  private daysUntilDue(order: CalendarOrderDto): number {
    const key = this.civilDate(order.dueDate);
    if (!key) return 0;
    const due = this.parseKey(key);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / 86400000);
  }

  private civilDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : null;
  }

  private parseKey(key: string): Date {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private shortDate(key: string): string {
    return this.parseKey(key).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
  }

  private digits(phone: string): string {
    const raw = phone.replace(/\D/g, '');
    return raw.slice(-8);
  }

  private currentWeekKeys(): Set<string> {
    const start = this.toMonday(new Date());
    const keys = new Set<string>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      keys.add(this.toKey(d));
    }
    return keys;
  }

  private toMonday(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return d;
  }

  private toKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatLong(date: Date): string {
    return date.toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  private formatMoney(value: number): string {
    return `Q${value.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  private readError(err: any, fallback: string): string {
    const message = err?.error?.message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
    return fallback;
  }
}
