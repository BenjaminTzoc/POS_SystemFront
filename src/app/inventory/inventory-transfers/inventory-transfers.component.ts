import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { InventoryTransfersService } from '../services/inventory-transfers.service';
import { InventoryTransfer, TransferStatus } from '../interfaces/inventory-transfer.interface';
import { TransferStatusPipe } from '../../shared/pipes/transfer-status.pipe';
import { environment } from '../../../environments/environment';

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

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading = true;
    this.transfersService.getTransfers().subscribe({
      next: (res) => {
        this.transfers = res.data;
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
