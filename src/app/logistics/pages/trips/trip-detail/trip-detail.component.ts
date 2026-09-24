import { Component, OnInit, inject, signal } from '@angular/core';
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
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tripsService = inject(TripsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

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
  saleDeliveryItems: { productId: string; name: string; sku: string; quantity: number; deliveredQuantity: number }[] = [];

  // Modal Entrega de Traslado (Inspección física)
  transferModalVisible = false;
  selectedTransferItem: TripItem | null = null;
  transferNotes = '';
  transferInspectionItems: { productId: string; name: string; sku: string; requestedQuantity: number; receivedQuantity: number }[] = [];

  // Modal Recepción de Devolución en Bodega
  returnModalVisible = false;
  selectedReturn: TripReturn | null = null;
  returnNotes = '';
  returnInspectionItems: { productId: string; name: string; sku: string; returnedQuantity: number; receivedQuantity: number }[] = [];

  // Modal Resolver Incidencia
  incidentModalVisible = false;
  selectedIncident: TripIncident | null = null;
  resolutionNotes = '';

  ngOnInit(): void {
    this.tripId = this.route.snapshot.paramMap.get('id');
    if (this.tripId) {
      this.loadTrip();
    } else {
      this.goBack();
    }
  }

  loadTrip(): void {
    if (!this.tripId) return;
    this.loading.set(true);
    this.tripsService.getTrip(this.tripId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.trip.set(res.data);
      },
      error: (err) => {
        this.loading.set(false);
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

  // --- Confirmar Salida ---
  confirmDeparture(): void {
    if (!this.tripId) return;
    this.confirmationService.confirm({
      message: '¿Está seguro de confirmar la salida del camión a ruta? El estado pasará a "En Ruta" y se habilitará la atención de paradas.',
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
              detail: err.error?.message || 'No se pudo confirmar la salida del camión.',
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
      message: '¿Desea dar por finalizado este viaje? Asegúrese de haber atendido todas las paradas y recepcionado devoluciones.',
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
            this.messageService.add({
              severity: 'error',
              summary: 'No se puede finalizar',
              detail: err.error?.message || 'Existen operaciones o devoluciones pendientes de procesar.',
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
    const saleItems = item.sale?.items || [];
    this.saleDeliveryItems = saleItems.map((si: any) => ({
      productId: si.productId || si.product?.id,
      name: si.product?.name || si.name || 'Producto',
      sku: si.product?.sku || si.sku || 'N/A',
      quantity: si.quantity || 1,
      deliveredQuantity: si.quantity || 1,
    }));

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
              productId: i.productId,
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

  // --- Modal Entrega de Traslado (Inspección) ---
  openTransferDeliveryModal(item: TripItem): void {
    this.selectedTransferItem = item;
    this.transferNotes = '';

    const transferItems = item.transfer?.items || [];
    this.transferInspectionItems = transferItems.map((ti: any) => ({
      productId: ti.productId || ti.product?.id,
      name: ti.product?.name || ti.name || 'Producto',
      sku: ti.product?.sku || ti.sku || 'N/A',
      requestedQuantity: ti.quantity || 1,
      receivedQuantity: ti.quantity || 1,
    }));

    this.transferModalVisible = true;
  }

  submitTransferDelivery(): void {
    if (!this.tripId || !this.selectedTransferItem) return;

    const payload: DeliverTransferPayload = {
      notes: this.transferNotes.trim() || undefined,
      items: this.transferInspectionItems.map((i) => ({
        productId: i.productId,
        receivedQuantity: i.receivedQuantity,
      })),
    };

    this.actionLoading.set(true);
    this.tripsService.deliverTransferItem(this.tripId, this.selectedTransferItem.id, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.transferModalVisible = false;
        this.trip.set(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Traslado Recibido',
          detail: 'El traslado entre sucursales ha sido inspeccionado y recibido.',
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

  // --- Modal Recepción de Devolución en Bodega ---
  openReturnReceptionModal(ret: TripReturn): void {
    this.selectedReturn = ret;
    this.returnNotes = '';
    this.returnInspectionItems = (ret.items || []).map((ri) => ({
      productId: ri.product?.id || (ri as any).productId,
      name: ri.product?.name || 'Producto en Devolución',
      sku: ri.product?.sku || 'N/A',
      returnedQuantity: ri.returnedQuantity,
      receivedQuantity: ri.receivedQuantity !== null && ri.receivedQuantity !== undefined ? ri.receivedQuantity : ri.returnedQuantity,
    }));

    this.returnModalVisible = true;
  }

  submitReturnReception(): void {
    if (!this.tripId || !this.selectedReturn) return;

    const payload: ReceiveTripReturnPayload = {
      notes: this.returnNotes.trim() || undefined,
      items: this.returnInspectionItems.map((i) => ({
        productId: i.productId,
        receivedQuantity: i.receivedQuantity,
      })),
    };

    this.actionLoading.set(true);
    this.tripsService.receiveReturn(this.tripId, this.selectedReturn.id, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.returnModalVisible = false;
        this.trip.set(res.data);
        this.messageService.add({
          severity: 'success',
          summary: 'Devolución Recibida',
          detail: 'La mercadería retornada ha ingresado a la bodega de origen.',
        });
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al recepcionar devolución',
          detail: err.error?.message || 'No se pudo procesar la recepción en bodega.',
        });
      },
    });
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
    return t.items.some((i) => i.status === 'pending');
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
}
