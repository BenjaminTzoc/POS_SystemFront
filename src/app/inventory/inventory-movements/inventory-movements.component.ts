import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InventoryMovement } from '../interfaces/inventory-movement.interface';
import { InventoryMovementsService } from '../services/inventory-movements.service';
import { DatePipe, Location } from '@angular/common';
import { InventoryMovementTypePipe } from '../../shared/pipes/inventory-movement-type.pipe';
import { TagModule } from 'primeng/tag';
import { environment } from '../../../environments/environment';
import { InventoryMovementConceptPipe } from '../../shared/pipes/inventory-movement-concept.pipe';
import { InventoryMovementStatusPipe } from '../../shared/pipes/inventory-movement-status.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { MovementFormComponent } from './movement-form/movement-form.component';

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
    Dialog,
    FormsModule,
    TextareaModule,
    ConfirmationModalComponent,
    MovementFormComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './inventory-movements.component.html',
  styleUrl: './inventory-movements.component.css',
})
export class InventoryMovementsComponent implements OnInit {
  @Input() isModal = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onMovementChange = new EventEmitter<void>();

  inventoryMovements: InventoryMovement[] = [];
  loading: boolean = false;
  stats: any = null;
  showNewMovementModal = false;

  // Complete dialog properties
  displayCompleteDialog: boolean = false;
  selectedMovementForComplete: InventoryMovement | null = null;
  submittingComplete: boolean = false;

  // Cancel dialog properties
  displayCancelDialog: boolean = false;
  cancelReason: string = '';
  selectedMovementForCancel: InventoryMovement | null = null;
  submittingCancel: boolean = false;

  // Delete dialog properties
  displayDeleteDialog: boolean = false;
  selectedMovementForDelete: InventoryMovement | null = null;
  submittingDelete: boolean = false;

  constructor(
    private inventoryMovementsService: InventoryMovementsService,
    private messageService: MessageService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadInventoryMovements();
    this.loadStats();
  }

  loadStats(): void {
    this.inventoryMovementsService.getStats().subscribe({
      next: (res) => {
        this.stats = res.data;
      },
      error: (err) => console.error('Error loading stats', err),
    });
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
    if (this.isModal) {
      this.showNewMovementModal = true;
    } else {
      this.router.navigate(['/inventory/new-movement']);
    }
  }

  onMovementSaved() {
    this.showNewMovementModal = false;
    this.loadInventoryMovements();
    this.loadStats();
    this.onMovementChange.emit();
  }

  goBack(): void {
    if (this.isModal) {
      this.onClose.emit();
    } else {
      this.location.back();
    }
  }

  confirmComplete(movement: InventoryMovement) {
    this.selectedMovementForComplete = movement;
    this.displayCompleteDialog = true;
  }

  closeCompleteDialog() {
    this.displayCompleteDialog = false;
    this.selectedMovementForComplete = null;
  }

  executeComplete() {
    if (!this.selectedMovementForComplete) return;

    this.submittingComplete = true;
    this.inventoryMovementsService.completeInventoryMovement(this.selectedMovementForComplete.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Completado',
          detail: 'El movimiento ha sido confirmado correctamente.',
        });
        this.closeCompleteDialog();
        this.loadInventoryMovements();
        this.loadStats();
        this.onMovementChange.emit();
        this.submittingComplete = false;
      },
      error: (error) => {
        this.submittingComplete = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo completar: ${error.error?.message || error.message}`,
        });
      },
    });
  }

  openCancelDialog(movement: InventoryMovement) {
    this.selectedMovementForCancel = movement;
    this.cancelReason = '';
    this.displayCancelDialog = true;
  }

  closeCancelDialog() {
    this.displayCancelDialog = false;
    this.selectedMovementForCancel = null;
    this.cancelReason = '';
  }

  executeCancel() {
    if (!this.selectedMovementForCancel || !this.cancelReason.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo Requerido',
        detail: 'Por favor, indique el motivo de la cancelación.',
      });
      return;
    }

    this.submittingCancel = true;
    this.inventoryMovementsService
      .cancelInventoryMovement(this.selectedMovementForCancel.id, this.cancelReason)
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'info',
            summary: 'Cancelado',
            detail: 'El movimiento ha sido cancelado.',
          });
          this.closeCancelDialog();
          this.loadInventoryMovements();
          this.loadStats();
          this.onMovementChange.emit();
          this.submittingCancel = false;
        },
        error: (error) => {
          this.submittingCancel = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `No se pudo cancelar: ${error.error?.message || error.message}`,
          });
        },
      });
  }

  confirmDelete(movement: InventoryMovement) {
    this.selectedMovementForDelete = movement;
    this.displayDeleteDialog = true;
  }

  closeDeleteDialog() {
    this.displayDeleteDialog = false;
    this.selectedMovementForDelete = null;
  }

  executeDelete() {
    if (!this.selectedMovementForDelete) return;

    this.submittingDelete = true;
    this.inventoryMovementsService.deleteMovement(this.selectedMovementForDelete.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'El movimiento ha sido eliminado.',
        });
        this.closeDeleteDialog();
        this.loadInventoryMovements();
        this.loadStats();
        this.onMovementChange.emit();
        this.submittingDelete = false;
      },
      error: (error) => {
        this.submittingDelete = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo eliminar: ${error.error?.message || error.message}`,
        });
      },
    });
  }

  editMovement(movement: InventoryMovement) {
    this.messageService.add({
      severity: 'info',
      summary: 'Info',
      detail: 'Funcionalidad de edición en desarrollo.',
    });
  }

  getSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type.toUpperCase()) {
      case 'IN':
      case 'TRANSFER_IN':
        return 'success';
      case 'OUT':
      case 'TRANSFER_OUT':
        return 'danger';
      case 'ADJUSTMENT':
        return 'warn';
      default:
        return 'info';
    }
  }

  getIcon(type: string): string {
    switch (type.toUpperCase()) {
      case 'IN':
      case 'TRANSFER_IN':
        return 'pi pi-arrow-down';
      case 'OUT':
      case 'TRANSFER_OUT':
        return 'pi pi-arrow-up';
      case 'ADJUSTMENT':
        return 'pi pi-sliders-h';
      default:
        return 'pi pi-info-circle';
    }
  }

  getConceptSeverity(
    concept: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (concept.toUpperCase()) {
      case 'PURCHASE':
      case 'RETURN':
        return 'success';
      case 'SALE':
      case 'WASTE':
        return 'danger';
      case 'TRANSFER':
        return 'info';
      case 'ADJUSTMENT':
        return 'warn';
      default:
        return 'secondary';
    }
  }

  getConceptIcon(concept: string): string {
    switch (concept.toUpperCase()) {
      case 'PURCHASE':
        return 'pi pi-shopping-cart';
      case 'SALE':
        return 'pi pi-tag';
      case 'TRANSFER':
        return 'pi pi-sync';
      case 'ADJUSTMENT':
        return 'pi pi-sliders-h';
      case 'WASTE':
        return 'pi pi-trash';
      case 'RETURN':
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
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warn';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'info';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'pi pi-check-circle';
      case 'PENDING':
        return 'pi pi-clock';
      case 'CANCELLED':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-question-circle';
    }
  }

  getSeverityClass(type: string): string {
    switch (type.toUpperCase()) {
      case 'IN':
      case 'TRANSFER_IN':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'OUT':
      case 'TRANSFER_OUT':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'ADJUSTMENT':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }

  getConceptClass(concept: string): string {
    switch (concept.toUpperCase()) {
      case 'PURCHASE':
      case 'RETURN':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'SALE':
      case 'WASTE':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'TRANSFER':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'ADJUSTMENT':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  }
}
