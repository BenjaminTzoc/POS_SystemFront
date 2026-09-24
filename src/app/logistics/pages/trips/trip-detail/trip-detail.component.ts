import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { filter, Subscription } from 'rxjs';
import {
  LucideArrowLeft,
  LucideTruck,
  LucideUser,
  LucideCalendar,
  LucideMapPin,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideSend,
  LucidePackage,
  LucideBoxes,
  LucideRotateCcw,
  LucideCheck,
  LucideShieldCheck,
  LucideRefreshCw,
} from '@lucide/angular';

import { TripsService } from '../../../services/trips.service';
import { TripsRealtimeService } from '../../../services/trips-realtime.service';
import {
  Trip,
  TripItem,
  TripReturn,
  TripIncident,
  DeliverSalePayload,
  DeliverTransferPayload,
  ReceiveTripReturnPayload,
} from '../../../interfaces/trip.interface';

@Component({
  selector: 'app-trip-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    LucideArrowLeft,
    LucideTruck,
    LucideUser,
    LucideCalendar,
    LucideMapPin,
    LucideCheckCircle2,
    LucideAlertTriangle,
    LucideSend,
    LucidePackage,
    LucideBoxes,
    LucideRotateCcw,
    LucideCheck,
    LucideShieldCheck,
    LucideRefreshCw,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './trip-detail.component.html',
})
export class TripDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripsService = inject(TripsService);
  private tripsRealtime = inject(TripsRealtimeService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private tripUpdatedSub?: Subscription;

  tripId: string | null = null;
  trip = signal<Trip | null>(null);
  loading = signal<boolean>(false);
  actionLoading = signal<boolean>(false);

  // Modal Entrega de Venta (OTP)
  saleModalVisible = false;
  selectedSaleItem: TripItem | null = null;
  saleOtp = '';
  saleOutcome: 'full' | 'partial' | 'rejected' = 'full';
  saleReason = '';
  saleDeliveryItems: {
    saleDetailId: string;
    productId?: string;
    name: string;
    sku: string;
    quantity: number;
    deliveredQuantity: number;
    unit: string;
    allowsDecimals: boolean;
  }[] = [];

  // Modal Entrega de Traslado (Inspección física)
  transferModalVisible = false;
  transferStep: 'quantities' | 'review' = 'quantities';
  selectedTransferItem: TripItem | null = null;
  transferNotes = '';
  transferInspectionItems: {
    productId: string;
    transferItemId?: string;
    name: string;
    sku: string;
    requestedQuantity: number;
    receivedQuantity: number;
    unit: string;
    allowsDecimals: boolean;
  }[] = [];

  // Modal Recepción de Merma en Bodega
  returnModalVisible = false;
  returnStep: 'quantities' | 'review' = 'quantities';
  selectedReturn: TripReturn | null = null;
  returnNotes = '';
  returnInspectionItems: {
    productId: string;
    name: string;
    sku: string;
    returnedQuantity: number;
    receivedQuantity: number;
    unit: string;
    allowsDecimals: boolean;
  }[] = [];

  // Modal Resolver Incidencia
  incidentModalVisible = false;
  selectedIncident: TripIncident | null = null;
  resolutionNotes = '';

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('id');
    if (this.tripId) {
      this.loadTrip();
      this.tripsRealtime.joinTrip(this.tripId);
      this.tripUpdatedSub = this.tripsRealtime
        .tripUpdated$()
        .pipe(filter((payload) => payload.tripId === this.tripId))
        .subscribe(() => this.loadTrip(true));
    } else {
      this.goBack();
    }
  }

  ngOnDestroy(): void {
    if (this.tripId) this.tripsRealtime.leaveTrip(this.tripId);
    this.tripUpdatedSub?.unsubscribe();
  }

  loadTrip(silent = false): void {
    if (!this.tripId) return;
    if (!silent) this.loading.set(true);
    this.tripsService.getTrip(this.tripId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.trip.set(res.data);
        this.syncOpenModals(res.data);
      },
      error: (err) => {
        this.loading.set(false);
        if (silent) return;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo cargar el detalle del viaje.',
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/logistics/trips']);
  }

  private syncOpenModals(trip: Trip): void {
    const items = trip.items ?? [];
    if (this.saleModalVisible && this.selectedSaleItem) {
      const current = items.find((item) => item.id === this.selectedSaleItem?.id);
      if (current && current.status !== 'pending') this.saleModalVisible = false;
    }
    if (this.returnModalVisible && this.selectedReturn) {
      const current = (trip.returns ?? []).find((item) => item.id === this.selectedReturn?.id);
      if (current && current.status !== 'pending_receipt') this.closeReturnModal();
    }
    if (this.incidentModalVisible && this.selectedIncident) {
      const current = (trip.incidents ?? []).find((item) => item.id === this.selectedIncident?.id);
      if (current && current.status !== 'open') this.incidentModalVisible = false;
    }
  }

  // --- Confirmar Salida ---
  confirmDeparture(): void {
    if (!this.tripId) return;
    this.confirmationService.confirm({
      message: '¿Está seguro de confirmar la salida del vehículo a ruta? El estado pasará a "En Ruta" y se habilitará la atención de paradas.',
      header: 'Confirmar Salida a Ruta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Confirmar Salida',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: '!bg-[#1e3a5f] !border-[#1e3a5f] !text-white !rounded-lg text-xs font-semibold',
      rejectButtonStyleClass: '!bg-slate-100 !border-slate-300 !text-slate-700 !rounded-lg text-xs font-semibold',
      accept: () => {
        this.actionLoading.set(true);
        this.tripsService.confirmDeparture(this.tripId!).subscribe({
          next: (res) => {
            this.actionLoading.set(false);
            this.trip.set(res.data);
            this.messageService.add({
              severity: 'success',
              summary: 'Salida Confirmada',
              detail: 'El viaje ha comenzado su recorrido.',
            });
          },
          error: (err) => {
            this.actionLoading.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error al confirmar salida',
              detail: err.error?.message || 'No se pudo confirmar la salida del vehículo.',
            });
          },
        });
      },
    });
  }

  // --- Finalizar Viaje ---
  completeTrip(): void {
    if (!this.tripId) return;
    this.confirmationService.confirm({
      message: '¿Desea dar por finalizado este viaje? No debe haber merma pendiente de bodega ni incidencias abiertas.',
      header: 'Finalizar Viaje',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, Finalizar Viaje',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: '!bg-emerald-600 !border-emerald-600 !text-white !rounded-lg text-xs font-semibold',
      rejectButtonStyleClass: '!bg-slate-100 !border-slate-300 !text-slate-700 !rounded-lg text-xs font-semibold',
      accept: () => {
        this.actionLoading.set(true);
        this.tripsService.completeTrip(this.tripId!).subscribe({
          next: (res) => {
            this.actionLoading.set(false);
            this.trip.set(res.data);
            this.messageService.add({
              severity: 'success',
              summary: 'Viaje Completado',
              detail: 'El viaje ha finalizado exitosamente.',
            });
          },
          error: (err) => {
            this.actionLoading.set(false);
            this.loadTrip(true);
            this.messageService.add({
              severity: 'error',
              summary: 'No se puede finalizar',
              detail: err.error?.message || 'Hay merma pendiente o incidencias abiertas.',
            });
          },
        });
      },
    });
  }

  // --- Modal Entrega de Venta (OTP) ---
  openSaleDeliveryModal(item: TripItem): void {
    this.selectedSaleItem = item;
    this.saleOtp = '';
    this.saleOutcome = 'full';
    this.saleReason = '';

    // Mapear items de la orden de venta si existen
    const saleItems = item.sale?.details?.length ? item.sale.details : (item.sale?.items || []);
    const seen = new Set<string>();
    this.saleDeliveryItems = saleItems.flatMap((si: any) => {
      const saleDetailId = String(si.id || '').trim();
      if (!saleDetailId || seen.has(saleDetailId)) return [];
      seen.add(saleDetailId);
      return [
        {
          saleDetailId,
          productId: si.productId || si.product?.id,
          name: si.product?.name || si.name || 'Producto',
          sku: si.product?.sku || si.sku || 'N/A',
          quantity: si.quantity || 1,
          deliveredQuantity: si.quantity || 1,
          ...this.unitFields(si.product?.unit),
        },
      ];
    });

    this.saleModalVisible = true;
  }

  submitSaleDelivery(): void {
    if (!this.tripId || !this.selectedSaleItem) return;
    if (!this.saleOtp.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Código OTP Requerido',
        detail: 'Debe ingresar el código OTP provisto por el cliente para certificar la entrega.',
      });
      return;
    }

    if (this.saleOutcome === 'rejected' && !this.saleReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Motivo requerido',
        detail: 'Por favor indique el motivo del rechazo del pedido.',
      });
      return;
    }

    const payload: DeliverSalePayload = {
      otp: this.saleOtp.trim(),
      outcome: this.saleOutcome,
      reason: this.saleReason.trim() || undefined,
      deliveredItems:
        this.saleOutcome === 'partial'
          ? this.saleDeliveryItems.map((i) => ({
              saleDetailId: i.saleDetailId,
              deliveredQuantity: i.deliveredQuantity,
            }))
          : undefined,
    };

    this.actionLoading.set(true);
    this.tripsService.deliverSaleItem(this.tripId, this.selectedSaleItem.id, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.saleModalVisible = false;
        this.trip.set(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Entrega Registrada',
          detail: 'La entrega de venta fue validada y registrada.',
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Validación OTP',
          detail: err.error?.message || 'Código OTP inválido o no se pudo procesar la entrega.',
        });
      },
    });
  }

  // --- Recepción de Traslado ---
  openTransferDeliveryModal(item: TripItem): void {
    this.selectedTransferItem = item;
    this.transferNotes = '';
    this.transferStep = 'quantities';

    const transferItems = item.transfer?.items || [];
    this.transferInspectionItems = transferItems.map((ti: any) => {
      const sent = Number(ti.quantity) || 0;
      return {
        productId: ti.productId || ti.product?.id,
        transferItemId: ti.id,
        name: ti.product?.name || ti.name || 'Producto',
        sku: ti.product?.sku || ti.sku || 'N/A',
        requestedQuantity: sent,
        receivedQuantity: sent,
        ...this.unitFields(ti.product?.unit),
      };
    });

    this.transferModalVisible = true;
  }

  closeTransferModal(): void {
    this.transferModalVisible = false;
    this.transferStep = 'quantities';
    this.actionLoading.set(false);
  }

  goToTransferReview(): void {
    if (!this.transferQuantitiesOk()) return;
    this.transferStep = 'review';
  }

  backToTransferQuantities(): void {
    this.transferStep = 'quantities';
  }

  missingQty(item: { requestedQuantity: number; receivedQuantity: number; allowsDecimals: boolean }): number {
    const received = Number(item.receivedQuantity);
    const sent = Number(item.requestedQuantity) || 0;
    const safeReceived = Number.isFinite(received) ? received : 0;
    return Math.max(0, this.roundTransferQty(sent - safeReceived, item.allowsDecimals));
  }

  hasTransferShortage(): boolean {
    return this.transferInspectionItems.some((item) => this.missingQty(item) > 0);
  }

  submitTransferDelivery(): void {
    if (!this.tripId || !this.selectedTransferItem) return;
    if (this.transferStep !== 'review') return;
    if (!this.transferQuantitiesOk()) {
      this.transferStep = 'quantities';
      return;
    }

    const duplicateProducts = this.hasDuplicateTransferProducts();
    const payload: DeliverTransferPayload = {
      notes: this.transferNotes.trim() || undefined,
      items: this.transferInspectionItems.map((i) => {
        const received = Number(i.receivedQuantity);
        const row: DeliverTransferPayload['items'][number] = {
          productId: i.productId,
          receivedQuantity: Number.isFinite(received) ? this.roundTransferQty(received, i.allowsDecimals) : 0,
        };
        if (duplicateProducts && i.transferItemId) row.transferItemId = i.transferItemId;
        return row;
      }),
    };

    this.actionLoading.set(true);
    this.tripsService.deliverTransferItem(this.tripId, this.selectedTransferItem.id, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        const shortage = this.hasTransferShortage();
        this.closeTransferModal();
        this.trip.set(res.data);
        this.messageService.add({
          severity: shortage ? 'warn' : 'success',
          summary: shortage ? 'Traslado con faltante' : 'Traslado recibido',
          detail: shortage
            ? 'Entró solo lo que sí llegó. La parada queda fallida y se abre una incidencia para planta.'
            : 'El traslado se recibió completo y entra a inventario del destino.',
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al recibir traslado',
          detail: err.error?.message || 'No se pudo procesar la recepción del traslado.',
        });
      },
    });
  }

  private transferQuantitiesOk(): boolean {
    const over = this.transferInspectionItems.find((item) => {
      const received = Number(item.receivedQuantity);
      if (!Number.isFinite(received)) return true;
      return received > item.requestedQuantity + 0.0001;
    });
    if (over) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad inválida',
        detail: `No se puede recibir más de lo enviado en ${over.name}.`,
      });
      return false;
    }

    if (this.hasTransferShortage() && !this.transferNotes.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Notas',
        detail: 'Indica qué faltó. El traslado quedará en discrepancia.',
      });
      return false;
    }
    return true;
  }

  private hasDuplicateTransferProducts(): boolean {
    const ids = this.transferInspectionItems.map((item) => item.productId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }

  private roundTransferQty(value: number, allowsDecimals: boolean): number {
    if (!allowsDecimals) return Math.round(value);
    return Math.round(value * 100) / 100;
  }

  // --- Recepción de merma en bodega ---
  openReturnReceptionModal(ret: TripReturn): void {
    this.selectedReturn = ret;
    this.returnNotes = '';
    this.returnStep = 'quantities';
    this.returnInspectionItems = (ret.items || []).map((ri) => {
      const returned = Number(ri.returnedQuantity) || 0;
      return {
        productId: ri.product?.id || (ri as any).productId,
        name: ri.product?.name || 'Producto',
        sku: ri.product?.sku || 'N/A',
        returnedQuantity: returned,
        receivedQuantity: returned,
        ...this.unitFields(ri.product?.unit),
      };
    });
    this.returnModalVisible = true;
  }

  closeReturnModal(): void {
    this.returnModalVisible = false;
    this.returnStep = 'quantities';
    this.actionLoading.set(false);
  }

  goToReturnReview(): void {
    if (!this.returnQuantitiesOk()) return;
    this.returnStep = 'review';
  }

  backToReturnQuantities(): void {
    this.returnStep = 'quantities';
  }

  missingReturnQty(item: {
    returnedQuantity: number;
    receivedQuantity: number;
    allowsDecimals: boolean;
  }): number {
    const received = Number(item.receivedQuantity);
    const expected = Number(item.returnedQuantity) || 0;
    const safe = Number.isFinite(received) ? received : 0;
    return Math.max(0, this.roundTransferQty(expected - safe, item.allowsDecimals));
  }

  hasReturnShortage(): boolean {
    return this.returnInspectionItems.some((item) => this.missingReturnQty(item) > 0);
  }

  submitReturnReception(): void {
    if (!this.tripId || !this.selectedReturn) return;
    if (this.returnStep !== 'review') return;
    if (!this.returnQuantitiesOk()) {
      this.returnStep = 'quantities';
      return;
    }

    const shortage = this.hasReturnShortage();
    const payload: ReceiveTripReturnPayload = {
      notes: this.returnNotes.trim() || undefined,
    };
    if (shortage) {
      payload.items = this.returnInspectionItems.map((i) => {
        const received = Number(i.receivedQuantity);
        return {
          productId: i.productId,
          receivedQuantity: Number.isFinite(received)
            ? this.roundTransferQty(received, i.allowsDecimals)
            : 0,
        };
      });
    }

    this.actionLoading.set(true);
    this.tripsService.receiveReturn(this.tripId, this.selectedReturn.id, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.closeReturnModal();
        this.trip.set(res.data);
        this.messageService.add({
          severity: shortage ? 'warn' : 'success',
          summary: shortage ? 'Merma con faltante' : 'Merma recibida',
          detail: shortage
            ? 'Se recibió lo que sí llegó y se abrió una incidencia. La reserva se libera; no entra stock.'
            : 'Bodega confirmó la merma. La reserva se libera; no hay entrada de stock.',
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al recibir merma',
          detail: err.error?.message || 'No se pudo procesar la recepción en bodega.',
        });
      },
    });
  }

  private returnQuantitiesOk(): boolean {
    const over = this.returnInspectionItems.find((item) => {
      const received = Number(item.receivedQuantity);
      if (!Number.isFinite(received)) return true;
      return received > item.returnedQuantity + 0.0001;
    });
    if (over) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cantidad inválida',
        detail: `No se puede recibir más de lo retornado en ${over.name}.`,
      });
      return false;
    }
    if (this.hasReturnShortage() && !this.returnNotes.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Notas',
        detail: 'Indica qué faltó. Se abrirá una incidencia.',
      });
      return false;
    }
    return true;
  }

  // --- Modal Resolver Incidencia ---
  openResolveIncidentModal(inc: TripIncident): void {
    this.selectedIncident = inc;
    this.resolutionNotes = '';
    this.incidentModalVisible = true;
  }

  submitIncidentResolution(): void {
    if (!this.tripId || !this.selectedIncident) return;
    if (!this.resolutionNotes.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Notas requeridas',
        detail: 'Ingrese la descripción de la resolución o justificación.',
      });
      return;
    }

    this.actionLoading.set(true);
    this.tripsService.resolveIncident(this.tripId, this.selectedIncident.id, this.resolutionNotes.trim()).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.incidentModalVisible = false;
        this.trip.set(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Incidencia Resuelta',
          detail: 'La incidencia ha sido marcada como resuelta.',
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al resolver incidencia',
          detail: err.error?.message || 'No se pudo resolver la incidencia.',
        });
      },
    });
  }

  // Helpers de estado
  getStatusLabel(status?: string): string {
    switch (status) {
      case 'draft': return 'Borrador / Planificado';
      case 'on_route': return 'En Ruta';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'N/A';
    }
  }

  getItemStatusLabel(status?: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'delivered': return 'Entregado Total';
      case 'partially_delivered': return 'Entrega Parcial';
      case 'rejected': return 'Rechazado';
      case 'failed': return 'Fallido';
      default: return status || 'N/A';
    }
  }

  getReturnStatusLabel(status?: string): string {
    switch (status) {
      case 'pending_receipt': return 'En Tránsito / Pendiente en Bodega';
      case 'received_in_warehouse': return 'Recepcionado en Bodega';
      case 'cancelled': return 'Cancelado';
      default: return status || 'N/A';
    }
  }

  hasPendingStops(): boolean {
    const t = this.trip();
    if (!t || !t.items) return false;
    return t.items.some((i) => i.status === 'pending' || i.status === 'failed');
  }

  hasPendingReturns(): boolean {
    const t = this.trip();
    if (!t || !t.returns) return false;
    return t.returns.some((r) => r.status === 'pending_receipt');
  }

  hasOpenIncidents(): boolean {
    const t = this.trip();
    if (!t || !t.incidents) return false;
    return t.incidents.some((i) => i.status === 'open');
  }

  canCompleteTrip(): boolean {
    const t = this.trip();
    if (!t) return false;
    if (t.status !== 'on_route') return false;
    return !this.hasPendingStops() && !this.hasPendingReturns() && !this.hasOpenIncidents();
  }

  completeBlockHint(): string {
    if (this.canCompleteTrip()) return 'Finalizar y cerrar viaje';
    if (this.hasPendingStops()) return 'Aún hay paradas pendientes o fallidas';
    if (this.hasPendingReturns()) return 'Hay merma pendiente de recibir en bodega';
    if (this.hasOpenIncidents()) return 'Hay incidencias abiertas por resolver';
    return 'El viaje aún no se puede completar';
  }

  qtyLabel(quantity: number, unit?: string): string {
    const abbr = unit?.trim();
    return abbr ? `${quantity} ${abbr}` : `${quantity}`;
  }

  productQtyLabel(quantity: number, product?: { unit?: { abbreviation?: string } | null } | null): string {
    return this.qtyLabel(quantity, product?.unit?.abbreviation);
  }

  private unitFields(unit?: { abbreviation?: string; allowsDecimals?: boolean } | null): {
    unit: string;
    allowsDecimals: boolean;
  } {
    return {
      unit: unit?.abbreviation?.trim() || '',
      allowsDecimals: !!unit?.allowsDecimals,
    };
  }
}
