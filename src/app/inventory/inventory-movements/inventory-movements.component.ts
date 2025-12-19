import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InventoryMovement } from '../interfaces/inventory-movement.interface';
import { InventoryMovementsService } from '../services/inventory-movements.service';
import { DatePipe } from '@angular/common';
import { InventoryMovementTypePipe } from '../../shared/pipes/inventory-movement-type.pipe';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';
import { InventoryMovementConceptPipe } from '../../shared/pipes/inventory-movement-concept.pipe';
import { InventoryMovementStatusPipe } from '../../shared/pipes/inventory-movement-status.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { Textarea, TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-inventory-movements',
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    DatePipe,
    InventoryMovementTypePipe,
    TagModule,
    InventoryMovementConceptPipe,
    InventoryMovementStatusPipe,
    TooltipModule,
    ConfirmDialog,
    Dialog,
    FormsModule,
    TextareaModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-movements.component.html',
  styleUrl: './inventory-movements.component.css',
})
export class InventoryMovementsComponent implements OnInit {
  inventoryMovements: InventoryMovement[] = [];
  loading: boolean = false;

  // Cancel dialog properties
  displayCancelDialog: boolean = false;
  cancelReason: string = '';
  selectedMovementId: string | null = null;
  submittingCancel: boolean = false;

  constructor(
    private inventoryMovementsService: InventoryMovementsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventoryMovements();
  }

  loadInventoryMovements(): void {
    this.loading = true;
    this.inventoryMovementsService.getInventoryMovements().subscribe({
      next: (res) => {
        this.inventoryMovements = res.data;
        this.loading = false;
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
      },
    });
  }

  recordMovement(): void {
    this.router.navigate(['/inventory/new-movement']);
  }

  confirmComplete(movement: InventoryMovement) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas completar este movimiento para "${movement.product?.name}"? Esto afectará el stock oficial.`,
      header: 'Confirmar Finalización',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, completar',
      rejectLabel: 'No, esperar',
      acceptButtonStyleClass: 'p-button-success',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.executeComplete(movement.id);
      },
    });
  }

  private executeComplete(id: string) {
    this.inventoryMovementsService.completeInventoryMovement(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Completado',
          detail: 'El movimiento ha sido confirmado correctamente.',
        });
        this.loadInventoryMovements();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo completar: ${error.error.message}`,
        });
      },
    });
  }

  openCancelDialog(movement: InventoryMovement) {
    this.selectedMovementId = movement.id;
    this.cancelReason = '';
    this.displayCancelDialog = true;
  }

  closeCancelDialog() {
    this.displayCancelDialog = false;
    this.selectedMovementId = null;
    this.cancelReason = '';
  }

  executeCancel() {
    if (!this.selectedMovementId || !this.cancelReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Por favor, indique el motivo de la cancelación.',
      });
      return;
    }

    this.submittingCancel = true;
    this.inventoryMovementsService
      .cancelInventoryMovement(this.selectedMovementId, this.cancelReason)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Cancelado',
            detail: 'El movimiento ha sido cancelado.',
          });
          this.closeCancelDialog();
          this.loadInventoryMovements();
          this.submittingCancel = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo cancelar: ${error.error.message}`,
          });
          this.submittingCancel = false;
        },
      });
  }

  getSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type) {
      case 'in':
      case 'transfer_in':
        return 'success';
      case 'out':
      case 'transfer_out':
        return 'danger';
      case 'adjustment':
        return 'warn';
      default:
        return 'info';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'in':
      case 'transfer_in':
        return 'pi pi-arrow-down';
      case 'out':
      case 'transfer_out':
        return 'pi pi-arrow-up';
      case 'adjustment':
        return 'pi pi-sliders-h';
      default:
        return 'pi pi-info-circle';
    }
  }

  getConceptSeverity(
    concept: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (concept) {
      case 'purchase':
      case 'return':
        return 'success';
      case 'sale':
      case 'waste':
        return 'danger';
      case 'transfer':
        return 'info';
      case 'adjustment':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getConceptIcon(concept: string): string {
    switch (concept) {
      case 'purchase':
        return 'pi pi-shopping-cart';
      case 'sale':
        return 'pi pi-tag';
      case 'transfer':
        return 'pi pi-sync';
      case 'adjustment':
        return 'pi pi-sliders-h';
      case 'waste':
        return 'pi pi-trash';
      case 'return':
        return 'pi pi-replay';
      default:
        return 'pi pi-question-circle';
    }
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }

  getStatusSeverity(
    status: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warn';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'pi pi-check-circle';
      case 'pending':
        return 'pi pi-clock';
      case 'cancelled':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-question-circle';
    }
  }
}
