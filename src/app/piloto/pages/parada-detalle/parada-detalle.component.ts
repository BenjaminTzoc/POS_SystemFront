import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs';
import { PilotoTripsService } from '../../services/piloto-trips.service';
import { TripsRealtimeService } from '../../../logistics/services/trips-realtime.service';
import {
  PilotoDeliverLine,
  PilotoDeliverOutcome,
  PilotoDeliverSalePayload,
  PilotoSale,
  PilotoSaleLine,
  PilotoStop,
  PilotoStopStatus,
  PilotoTrip,
  PilotoTripStatus,
} from '../../models/piloto-trip.models';

type DeliverStep = 'choose' | 'confirm' | 'capture';

@Component({
  selector: 'app-piloto-parada-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parada-detalle.component.html',
  styleUrl: './parada-detalle.component.css',
})
export class ParadaDetalleComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trips = inject(PilotoTripsService);
  private realtime = inject(TripsRealtimeService);
  private messages = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  tripId = this.route.snapshot.paramMap.get('id') ?? '';
  stopId = this.route.snapshot.paramMap.get('itemId') ?? '';
  loading = signal(true);
  submitting = signal(false);
  trip = signal<PilotoTrip | null>(null);
  step = signal<DeliverStep>('choose');
  outcome = signal<PilotoDeliverOutcome | null>(null);
  otp = signal('');
  reason = signal('');
  incidentOpen = signal(false);
  incidentDraft = signal('');
  reporting = signal(false);
  deliveredByProduct = signal<Record<string, number>>({});
  deliveredDraft = signal<Record<string, string>>({});
  returnedDraft = signal<Record<string, string>>({});

  stop = computed(() => this.trip()?.items?.find((item) => item.id === this.stopId) ?? null);

  saleLinesList = computed(() => {
    const current = this.stop();
    if (!current || current.type !== 'sale_order') return [];
    return this.saleLines(current);
  });

  transferLinesList = computed(() => {
    const current = this.stop();
    if (!current || current.type !== 'transfer') return [];
    return current.transfer?.items ?? [];
  });

  saleDeliverLines = computed(() => this.toDeliverLines(this.saleLinesList()));

  notes = computed(() => {
    const current = this.stop();
    return (current?.notes || current?.sale?.notes || '').trim();
  });

  canDeliverSale = computed(() => {
    const trip = this.trip();
    const current = this.stop();
    return trip?.status === 'on_route' && current?.type === 'sale_order' && current.status === 'pending';
  });

  constructor() {
    if (!this.tripId || !this.stopId) {
      this.router.navigate(['/piloto']);
      return;
    }
    this.load();
    this.realtime.joinTrip(this.tripId);
    this.realtime
      .tripUpdated$()
      .pipe(
        filter((payload) => payload.tripId === this.tripId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load(true));
    this.destroyRef.onDestroy(() => this.realtime.leaveTrip(this.tripId));
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    this.trips.getById(this.tripId).subscribe({
      next: (res) => {
        this.trip.set(res.data);
        this.loading.set(false);
        const stop = res.data.items?.find((item) => item.id === this.stopId);
        if (!stop) {
          if (silent) {
            this.back();
            return;
          }
          this.messages.add({
            severity: 'error',
            summary: 'Parada',
            detail: 'Esta parada no está en el viaje.',
          });
          this.back();
          return;
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (silent) return;
        this.messages.add({
          severity: 'error',
          summary: 'Viaje',
          detail: err.error?.message || 'No se pudo cargar la parada.',
        });
        this.back();
      },
    });
  }

  back(): void {
    this.router.navigate(['/piloto', this.tripId]);
  }

  choose(outcome: PilotoDeliverOutcome): void {
    if (!this.canDeliverSale()) return;
    this.outcome.set(outcome);
    this.otp.set('');
    this.reason.set('');
    this.step.set('confirm');
  }

  cancelFlow(): void {
    this.step.set('choose');
    this.outcome.set(null);
    this.otp.set('');
    this.reason.set('');
    this.deliveredByProduct.set({});
    this.deliveredDraft.set({});
    this.returnedDraft.set({});
  }

  acceptConfirm(): void {
    if (this.outcome() === 'partial') this.initDelivered(this.saleDeliverLines());
    this.step.set('capture');
  }

  onOtp(value: string): void {
    this.otp.set(value.replace(/\D/g, '').slice(0, 6));
  }

  openIncidentForm(): void {
    if (this.trip()?.status !== 'on_route') return;
    this.incidentOpen.set(true);
    this.incidentDraft.set('');
  }

  cancelIncident(): void {
    this.incidentOpen.set(false);
    this.incidentDraft.set('');
  }

  submitIncident(): void {
    if (this.trip()?.status !== 'on_route' || this.reporting()) return;
    const description = this.incidentDraft().trim();
    if (!description) {
      this.messages.add({
        severity: 'warn',
        summary: 'Incidencia',
        detail: 'Describe qué pasó.',
      });
      return;
    }
    this.reporting.set(true);
    this.trips.createIncident(this.tripId, { description, tripItemId: this.stopId }).subscribe({
      next: (res) => {
        this.reporting.set(false);
        this.cancelIncident();
        if (res.data) this.trip.set(res.data);
        this.messages.add({
          severity: 'success',
          summary: 'Incidencia',
          detail: 'Quedó reportada. Planta la resuelve.',
        });
      },
      error: (err) => {
        this.reporting.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se reportó',
          detail: err.error?.message || 'No se pudo crear la incidencia.',
        });
      },
    });
  }

  selectAll(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target?.select) return;
    setTimeout(() => target.select(), 0);
  }

  deliveredOf(productId: string): number {
    return this.deliveredByProduct()[productId] ?? 0;
  }

  returnedOf(productId: string, ordered: number): number {
    return Math.max(0, ordered - this.deliveredOf(productId));
  }

  setDelivered(
    productId: string,
    ordered: number,
    raw: string,
    allowsDecimals: boolean,
    commit = false,
  ): void {
    const cleaned = this.sanitizeQtyRaw(raw, allowsDecimals);
    const parsed = this.parseQty(cleaned, ordered, allowsDecimals, commit);
    if (commit) {
      this.applyDelivered(productId, ordered, parsed ?? 0, allowsDecimals);
      return;
    }
    this.deliveredDraft.update((current) => ({ ...current, [productId]: cleaned }));
    if (parsed === null) return;
    this.deliveredByProduct.update((current) => ({ ...current, [productId]: parsed }));
    this.returnedDraft.update((current) => ({
      ...current,
      [productId]: this.formatQty(Math.max(0, this.roundQty(ordered - parsed, allowsDecimals)), allowsDecimals),
    }));
  }

  setReturned(
    productId: string,
    ordered: number,
    raw: string,
    allowsDecimals: boolean,
    commit = false,
  ): void {
    const cleaned = this.sanitizeQtyRaw(raw, allowsDecimals);
    const returned = this.parseQty(cleaned, ordered, allowsDecimals, commit);
    if (commit) {
      this.applyDelivered(
        productId,
        ordered,
        this.roundQty(ordered - (returned ?? 0), allowsDecimals),
        allowsDecimals,
      );
      return;
    }
    this.returnedDraft.update((current) => ({ ...current, [productId]: cleaned }));
    if (returned === null) return;
    const delivered = this.roundQty(ordered - returned, allowsDecimals);
    this.deliveredByProduct.update((current) => ({ ...current, [productId]: delivered }));
    this.deliveredDraft.update((current) => ({
      ...current,
      [productId]: this.formatQty(delivered, allowsDecimals),
    }));
  }

  formatQty(value: number, allowsDecimals: boolean): string {
    const rounded = this.roundQty(value, allowsDecimals);
    return allowsDecimals ? rounded.toFixed(2) : String(rounded);
  }

  submitSale(): void {
    const current = this.stop();
    const outcome = this.outcome();
    if (!current || !this.canDeliverSale() || this.submitting() || !outcome) return;
    if (outcome === 'partial' && !this.partialQuantitiesOk()) return;
    if (outcome === 'rejected' && !this.reason().trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Motivo',
        detail: 'Indica por qué se rechazó.',
      });
      return;
    }
    if (!/^\d{6}$/.test(this.otp())) {
      this.messages.add({
        severity: 'warn',
        summary: 'OTP',
        detail: 'Pide al cliente el código de 6 dígitos.',
      });
      return;
    }

    const payload: PilotoDeliverSalePayload = { otp: this.otp(), outcome };
    if (outcome !== 'full') payload.reason = this.reason().trim();
    if (outcome === 'partial') {
      payload.deliveredItems = this.saleDeliverLines().map((line) => ({
        saleDetailId: line.saleDetailId,
        deliveredQuantity: this.deliveredOf(line.key),
      }));
    }

    this.submitting.set(true);
    this.trips.deliverSale(this.tripId, current.id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.messages.add({
          severity: 'success',
          summary: 'Entrega',
          detail:
            outcome === 'full'
              ? 'Entrega completa registrada.'
              : outcome === 'partial'
                ? 'Parcial registrada. Lo no entregado vuelve a planta.'
                : 'Pedido rechazado.',
        });
        this.back();
      },
      error: (err) => {
        this.submitting.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se entregó',
          detail: err.error?.message || 'OTP inválido o no se pudo registrar.',
        });
      },
    });
  }

  statusLabel(status: PilotoTripStatus | PilotoStopStatus): string {
    switch (status) {
      case 'draft':
        return 'Por salir';
      case 'on_route':
        return 'En ruta';
      case 'pending':
        return 'Pendiente';
      case 'delivered':
        return 'Entregado';
      case 'partially_delivered':
        return 'Parcial';
      case 'rejected':
        return 'Rechazado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  }

  customerName(sale?: PilotoSale): string {
    return sale?.customer?.name || sale?.guestCustomer?.name || 'Cliente';
  }

  invoiceLabel(sale?: PilotoSale): string {
    const number = sale?.invoiceNumber || sale?.orderNumber;
    return number ? `#${number}` : 'Sin factura';
  }

  destBranch(stop: PilotoStop): string {
    return stop.transfer?.destinationBranch?.name || stop.transfer?.toBranch?.name || 'Sucursal destino';
  }

  transferNumber(stop: PilotoStop): string {
    return stop.transfer?.transferNumber || '';
  }

  deliveryAddress(stop: PilotoStop): string {
    if (stop.type === 'sale_order') return stop.sale?.deliveryAddress?.trim() || '';
    return (
      stop.transfer?.destinationBranch?.address?.trim() ||
      stop.transfer?.toBranch?.address?.trim() ||
      ''
    );
  }

  lineName(line: PilotoSaleLine): string {
    return line.product?.name || line.name || 'Producto';
  }

  lineSku(line: PilotoSaleLine): string {
    return line.product?.sku || line.sku || '';
  }

  lineUnit(line: PilotoSaleLine): string {
    return this.unitOf(line.product?.unit);
  }

  confirmTitle(): string {
    switch (this.outcome()) {
      case 'rejected':
        return '¿Marcar como rechazada?';
      case 'partial':
        return '¿Marcar como parcial?';
      default:
        return '¿Marcar entrega completa?';
    }
  }

  confirmText(): string {
    switch (this.outcome()) {
      case 'rejected':
        return 'El cliente no recibe el pedido. Luego pedirás el OTP para confirmar.';
      case 'partial':
        return 'Vas a indicar cuánto se entrega y cuánto regresa a planta. Luego pedirás el OTP al cliente.';
      default:
        return 'Se entregará todo lo de esta parada. Luego pedirás el OTP al cliente.';
    }
  }

  private partialQuantitiesOk(): boolean {
    const lines = this.saleDeliverLines();
    if (!lines.length) {
      this.messages.add({ severity: 'warn', summary: 'Productos', detail: 'No hay productos para registrar.' });
      return false;
    }
    const allFull = lines.every(
      (line) =>
        this.roundQty(this.deliveredOf(line.key), line.allowsDecimals) ===
        this.roundQty(line.ordered, line.allowsDecimals),
    );
    const allZero = lines.every((line) => this.roundQty(this.deliveredOf(line.key), line.allowsDecimals) === 0);
    if (allFull) {
      this.messages.add({
        severity: 'warn',
        summary: 'Parcial',
        detail: 'Si entregas todo, usa Completa.',
      });
      return false;
    }
    if (allZero) {
      this.messages.add({
        severity: 'warn',
        summary: 'Parcial',
        detail: 'Si no entregas nada, usa Rechazada.',
      });
      return false;
    }
    if (!this.reason().trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Motivo',
        detail: 'Indica por qué fue parcial.',
      });
      return false;
    }
    return true;
  }

  private saleLines(stop: PilotoStop): PilotoSaleLine[] {
    return stop.sale?.details ?? [];
  }

  private unitOf(unit?: { abbreviation?: string; name?: string } | null): string {
    return unit?.abbreviation?.trim() || unit?.name?.trim() || '';
  }

  private toDeliverLines(lines: PilotoSaleLine[]): PilotoDeliverLine[] {
    const seen = new Set<string>();
    return lines.flatMap((line) => {
      const saleDetailId = line.id?.trim();
      if (!saleDetailId || seen.has(saleDetailId)) return [];
      seen.add(saleDetailId);
      return [
        {
          key: saleDetailId,
          saleDetailId,
          productId: line.product?.id || line.productId,
          name: this.lineName(line),
          sku: this.lineSku(line),
          unit: this.unitOf(line.product?.unit),
          allowsDecimals: !!line.product?.unit?.allowsDecimals,
          ordered: Number(line.quantity) || 0,
        },
      ];
    });
  }

  private initDelivered(lines: PilotoDeliverLine[]): void {
    const next: Record<string, number> = {};
    const delivered: Record<string, string> = {};
    const returned: Record<string, string> = {};
    for (const line of lines) {
      next[line.key] = line.ordered;
      delivered[line.key] = this.formatQty(line.ordered, line.allowsDecimals);
      returned[line.key] = this.formatQty(0, line.allowsDecimals);
    }
    this.deliveredByProduct.set(next);
    this.deliveredDraft.set(delivered);
    this.returnedDraft.set(returned);
  }

  private applyDelivered(productId: string, ordered: number, delivered: number, allowsDecimals: boolean): void {
    const next = Math.min(ordered, Math.max(0, this.roundQty(delivered, allowsDecimals)));
    this.deliveredByProduct.update((current) => ({ ...current, [productId]: next }));
    this.deliveredDraft.update((current) => ({ ...current, [productId]: this.formatQty(next, allowsDecimals) }));
    this.returnedDraft.update((current) => ({
      ...current,
      [productId]: this.formatQty(Math.max(0, this.roundQty(ordered - next, allowsDecimals)), allowsDecimals),
    }));
  }

  private sanitizeQtyRaw(raw: string, allowsDecimals: boolean): string {
    let value = String(raw ?? '').replace(',', '.').replace(/[^\d.]/g, '');
    if (!allowsDecimals) return value.replace(/\./g, '');
    const dot = value.indexOf('.');
    if (dot >= 0) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, '').slice(0, 2);
    return value;
  }

  private parseQty(raw: string, ordered: number, allowsDecimals: boolean, commit: boolean): number | null {
    const normalized = String(raw ?? '').trim();
    if (!normalized) return commit ? 0 : null;
    if (!commit && allowsDecimals && /\.$/.test(normalized)) return null;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return commit ? 0 : null;
    return Math.min(ordered, Math.max(0, this.roundQty(parsed, allowsDecimals)));
  }

  private roundQty(value: number, allowsDecimals: boolean): number {
    if (!allowsDecimals) return Math.round(value);
    return Math.round(value * 100) / 100;
  }
}
