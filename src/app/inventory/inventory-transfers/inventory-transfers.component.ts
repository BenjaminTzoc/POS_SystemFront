import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { RippleModule } from 'primeng/ripple';
import { InventoryTransfersService } from '../services/inventory-transfers.service';
import { InventoryTransfer, TransferStatus } from '../interfaces/inventory-transfer.interface';
import { TransferStatusPipe } from '../../shared/pipes/transfer-status.pipe';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

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
    TransferStatusPipe,
    RippleModule,
    FormsModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-transfers.component.html',
  styleUrl: './inventory-transfers.component.css',
})
export class InventoryTransfersComponent implements OnInit {
  private transfersService = inject(InventoryTransfersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  transfers: InventoryTransfer[] = [];
  loading = false;
  expandedRows: any = {};

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

  onRowExpand(event: any): void {
    const transfer = event.data as InventoryTransfer;
    // Si ya tiene items, no necesitamos volver a cargarlos
    if (transfer.items && transfer.items.length > 0) return;

    // Cargamos los detalles completos
    this.transfersService.getTransferById(transfer.id).subscribe({
      next: (res) => {
        const fullTransfer = res.data;
        // Actualizamos el objeto en la lista para que la expansión muestre los datos
        const index = this.transfers.findIndex((t) => t.id === transfer.id);
        if (index !== -1) {
          this.transfers[index] = { ...fullTransfer };
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

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
