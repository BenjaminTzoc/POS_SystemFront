import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { InventoryTransfersService } from '../services/inventory-transfers.service';
import { InventoryTransfer, InventoryTransferItem, TransferStatus } from '../interfaces/inventory-transfer.interface';
import { TransferStatusPipe } from '../../shared/pipes/transfer-status.pipe';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TripsService } from '../../logistics/services/trips.service';
import { DeliverTransferPayload, Trip } from '../../logistics/interfaces/trip.interface';

import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-inventory-transfers',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialog,
    DialogModule,
    InputNumberModule,
    TextareaModule,
    TransferStatusPipe,
    RippleModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    StandardTableComponent,
    StatusBadgeComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-transfers.component.html',
  styleUrl: './inventory-transfers.component.css',
})
export class InventoryTransfersComponent implements OnInit {
  private transfersService = inject(InventoryTransfersService);
  private tripsService = inject(TripsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  transfers: InventoryTransfer[] = [];
  loading = false;
  expandedRows: any = {};

  receiveModalVisible = false;
  receiveStep: 'quantities' | 'review' = 'quantities';
  receiveSubmitting = false;
  receiveNotes = '';
  receiveTripId = '';
  receiveItemId = '';
  receiveItems: {
    productId: string;
    transferItemId?: string;
    name: string;
    sku: string;
    requestedQuantity: number;
    receivedQuantity: number;
    unit: string;
    allowsDecimals: boolean;
  }[] = [];

  // Filters
  searchTerm = '';
  statusFilter: TransferStatus | null = null;
  dateRange: Date[] | null = null;
  
  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Enviado', value: 'SHIPPED' },
    { label: 'Recibido', value: 'RECEIVED' },
    { label: 'Cancelado', value: 'CANCELLED' }
  ];

  ngOnInit(): void {
    this.loadTransfers();
  }

  clearFilters(): void {
    this.statusFilter = null;
    this.dateRange = null;
    this.searchTerm = '';
    this.loadTransfers();
  }

  toggleRowExpansion(transfer: InventoryTransfer, table: StandardTableComponent, event: Event): void {
    event.stopPropagation();
    table.toggleRow(transfer, event);
    this.fetchTransferDetailsIfNeeded(transfer);
  }

  fetchTransferDetailsIfNeeded(transfer: InventoryTransfer): void {
    if (transfer.items && transfer.items.length > 0) return;

    this.transfersService.getTransferById(transfer.id).subscribe({
      next: (res) => {
        const fullTransfer = res.data;
        Object.assign(transfer, fullTransfer);
        const index = this.transfers.findIndex((t) => t.id === transfer.id);
        if (index !== -1) {
          this.transfers[index] = { ...transfer, ...fullTransfer };
        }
      },
      error: (err) => {
        console.error('Error loading transfer details:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los detalles del traslado.',
        });
      },
    });
  }

  onRowExpand(event: any): void {
    const transfer = event.data as InventoryTransfer;
    this.fetchTransferDetailsIfNeeded(transfer);
  }

  loadTransfers(): void {
    this.loading = true;
    
    const filters: any = {};
    if (this.statusFilter) filters.status = this.statusFilter;
    
    if (this.dateRange && this.dateRange.length > 0) {
      if (this.dateRange[0]) {
        filters.startDate = this.dateRange[0].toISOString().split('T')[0];
      }
      if (this.dateRange[1]) {
        filters.endDate = this.dateRange[1].toISOString().split('T')[0];
      } else if (this.dateRange[0]) {
        // Si solo hay una fecha seleccionada, usamos la misma para inicio y fin
        filters.endDate = filters.startDate;
      }
    }

    this.transfersService.getTransfers(filters).subscribe({
      next: (res) => {
        let data = res.data;
        
        // Búsqueda local por número de traslado si hay searchTerm
        if (this.searchTerm) {
          const term = this.searchTerm.toLowerCase();
          data = data.filter(t => 
            t.transferNumber.toLowerCase().includes(term) ||
            t.originBranchName.toLowerCase().includes(term) ||
            t.destinationBranchName.toLowerCase().includes(term)
          );
        }
        
        this.transfers = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los traslados.',
        });
      },
    });
  }

  goToNewTransfer(): void {
    this.router.navigate(['/inventory/new-transfer']);
  }

  editTransfer(transfer: InventoryTransfer): void {
    this.router.navigate(['/inventory/edit-transfer', transfer.id]);
  }

  openReceiveTransfer(transfer: InventoryTransfer): void {
    this.loading = true;
    this.transfersService.getTransferById(transfer.id).subscribe({
      next: (res) => {
        const full = res.data;
        this.resolveTripStop(full).subscribe({
          next: (stop) => {
            this.loading = false;
            if (!stop) {
              this.messageService.add({
                severity: 'warn',
                summary: 'Traslado',
                detail: 'Este traslado no está en un viaje en ruta. Recíbelo cuando salga en viaje.',
              });
              return;
            }
            this.receiveTripId = stop.tripId;
            this.receiveItemId = stop.itemId;
            this.receiveNotes = '';
            this.receiveStep = 'quantities';
            this.receiveItems = this.mapReceiveItems(full, stop.transferItems);
            this.receiveModalVisible = true;
          },
          error: () => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Traslado',
              detail: 'No se pudo localizar el viaje de este traslado.',
            });
          },
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos del traslado.',
        });
      },
    });
  }

  closeReceiveModal(): void {
    this.receiveModalVisible = false;
    this.receiveStep = 'quantities';
    this.receiveSubmitting = false;
  }

  goToReceiveReview(): void {
    if (!this.receiveQuantitiesOk()) return;
    this.receiveStep = 'review';
  }

  backToReceiveQuantities(): void {
    this.receiveStep = 'quantities';
  }

  missingQty(item: { requestedQuantity: number; receivedQuantity: number; allowsDecimals: boolean }): number {
    const received = Number(item.receivedQuantity);
    const sent = Number(item.requestedQuantity) || 0;
    const safeReceived = Number.isFinite(received) ? received : 0;
    return Math.max(0, this.roundQty(sent - safeReceived, item.allowsDecimals));
  }

  hasReceiveShortage(): boolean {
    return this.receiveItems.some((item) => this.missingQty(item) > 0);
  }

  qtyLabel(quantity: number, unit?: string): string {
    const abbr = unit?.trim();
    const value = Number.isFinite(quantity) ? quantity : 0;
    return abbr ? `${value} ${abbr}` : `${value}`;
  }

  submitReceiveTransfer(): void {
    if (this.receiveStep !== 'review') return;
    if (!this.receiveQuantitiesOk()) {
      this.receiveStep = 'quantities';
      return;
    }

    const duplicateProducts = this.hasDuplicateProducts();
    const payload: DeliverTransferPayload = {
      notes: this.receiveNotes.trim() || undefined,
      items: this.receiveItems.map((i) => {
        const received = Number(i.receivedQuantity);
        const row: DeliverTransferPayload['items'][number] = {
          productId: i.productId,
          receivedQuantity: Number.isFinite(received) ? this.roundQty(received, i.allowsDecimals) : 0,
        };
        if (duplicateProducts && i.transferItemId) row.transferItemId = i.transferItemId;
        return row;
      }),
    };

    this.receiveSubmitting = true;
    this.tripsService.deliverTransferItem(this.receiveTripId, this.receiveItemId, payload).subscribe({
      next: () => {
        const shortage = this.hasReceiveShortage();
        this.receiveSubmitting = false;
        this.closeReceiveModal();
        this.loadTransfers();
        this.messageService.add({
          severity: shortage ? 'warn' : 'success',
          summary: shortage ? 'Traslado con faltante' : 'Traslado recibido',
          detail: shortage
            ? 'Entró solo lo que sí llegó. El traslado queda en discrepancia.'
            : 'El stock se sumó en la sucursal de destino.',
        });
      },
      error: (err) => {
        this.receiveSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error al recibir traslado',
          detail: err.error?.message || 'No se pudo procesar la recepción.',
        });
      },
    });
  }

  private receiveQuantitiesOk(): boolean {
    const over = this.receiveItems.find((item) => {
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
    if (this.hasReceiveShortage() && !this.receiveNotes.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Notas',
        detail: 'Indica qué faltó. El traslado quedará en discrepancia.',
      });
      return false;
    }
    return true;
  }

  private hasDuplicateProducts(): boolean {
    const ids = this.receiveItems.map((item) => item.productId).filter(Boolean);
    return new Set(ids).size !== ids.length;
  }

  private roundQty(value: number, allowsDecimals: boolean): number {
    if (!allowsDecimals) return Math.round(value);
    return Math.round(value * 100) / 100;
  }

  private mapReceiveItems(transfer: InventoryTransfer, tripItems?: any[]) {
    const source = (tripItems?.length ? tripItems : transfer.items) ?? [];
    return source.map((item: InventoryTransferItem & { product?: any; id?: string; quantity?: number }) => {
      const unit = item.product?.unit;
      const sent = Number(item.quantity) || 0;
      return {
        productId: item.productId || item.product?.id,
        transferItemId: item.id,
        name: item.productName || item.product?.name || 'Producto',
        sku: item.sku || item.product?.sku || '---',
        requestedQuantity: sent,
        receivedQuantity: sent,
        unit: unit?.abbreviation?.trim() || item.unitAbbreviation || '',
        allowsDecimals: !!unit?.allowsDecimals,
      };
    });
  }

  private resolveTripStop(transfer: InventoryTransfer) {
    const tripId = transfer.tripId || transfer.trip?.id;
    const itemId = transfer.tripItemId || transfer.tripItem?.id;
    if (tripId && itemId) return of({ tripId, itemId, transferItems: transfer.items });

    return this.tripsService.getTrips(undefined, 'on_route').pipe(
      switchMap((res) => {
        const trips = res.data ?? [];
        const found = this.findTransferStop(trips, transfer.id);
        if (found) return of(found);
        if (!trips.length) return of(null);
        return forkJoin(trips.map((trip) => this.tripsService.getTrip(trip.id))).pipe(
          map((details) => {
            for (const detail of details) {
              const hit = this.findTransferStop([detail.data], transfer.id);
              if (hit) return hit;
            }
            return null;
          }),
        );
      }),
    );
  }

  private findTransferStop(trips: Trip[], transferId: string) {
    for (const trip of trips) {
      const item = (trip.items ?? []).find(
        (stop) => stop.type === 'transfer' && stop.transfer?.id === transferId,
      );
      if (item) {
        return {
          tripId: trip.id,
          itemId: item.id,
          transferItems: item.transfer?.items as InventoryTransferItem[] | undefined,
        };
      }
    }
    return null;
  }

  confirmStatusChange(transfer: InventoryTransfer, newStatus: TransferStatus): void {
    let header = 'Confirmar Cambio';
    let message = `¿Estás seguro de que deseas cambiar el estado a ${newStatus}?`;
    let icon = 'pi pi-exclamation-triangle';
    let acceptLabel = 'Sí, cambiar';
    let severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined =
      'info';

    if (newStatus === 'RECEIVED') {
      header = 'Confirmar Recepción';
      message =
        'Al marcar como RECIBIDO, el stock se sumará en la sucursal de destino. Esta acción no se puede deshacer.';
      severity = 'success';
    } else if (newStatus === 'CANCELLED') {
      header = 'Confirmar Cancelación';
      message =
        'Al CANCELAR, el stock regresará a la sucursal de origen. Esta acción no se puede deshacer.';
      severity = 'danger';
    }

    this.confirmationService.confirm({
      header,
      message,
      icon,
      acceptLabel,
      acceptButtonStyleClass: `p-button-${severity}`,
      rejectLabel: 'Cerrar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.updateStatus(transfer.id, newStatus);
      },
    });
  }

  private updateStatus(id: string, status: TransferStatus): void {
    this.transfersService.updateStatus(id, status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: 'El estado del traslado ha sido actualizado.',
        });
        this.loadTransfers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo actualizar el estado: ${err.error.message}`,
        });
      },
    });
  }

  getSeverity(
    status: TransferStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'SHIPPED':
        return 'info';
      case 'RECEIVED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getIcon(status: TransferStatus): string {
    switch (status) {
      case 'PENDING':
        return 'pi pi-clock';
      case 'SHIPPED':
        return 'pi pi-truck';
      case 'RECEIVED':
        return 'pi pi-check-circle';
      case 'CANCELLED':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  getTotalUnits(transfer: InventoryTransfer): number {
    if (!transfer.items || !transfer.items.length) return 0;
    return transfer.items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
