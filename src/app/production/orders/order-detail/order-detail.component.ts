import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ProductionOrderService } from '../../services/production-order.service';
import { IProductionOrder, ProductionOrderStatus } from '../../interfaces/production-order.interface';
import { environment } from '../../../../environments/environment';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-production-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    DividerModule,
    InputNumberModule,
    FormsModule,
    DialogModule,
    DatePipe,
    CurrencyPipe,
    ConfirmDialogModule,
    TableModule,
    TextareaModule
  ],
  providers: [ConfirmationService],
  templateUrl: './order-detail.component.html'
})
export class ProductionOrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productionService = inject(ProductionOrderService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  order = signal<IProductionOrder | null>(null);
  loading = signal<boolean>(true);
  completingOrder = signal<boolean>(false);
  showCompleteDialog = signal<boolean>(false);
  actualQuantity = signal<number>(0);

  // Cancellation
  showCancelDialog = signal<boolean>(false);
  cancelReason = signal<string>('');
  cancellingOrder = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrder(id);
    }
  }

  loadOrder(id: string): void {
    this.loading.set(true);
    this.productionService.getOrder(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.order.set(res.data);
          this.actualQuantity.set(res.data.plannedQuantity);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle de la orden'
        });
        this.loading.set(false);
      }
    });
  }

  onComplete(): void {
    if (!this.order()) return;
    this.showCompleteDialog.set(true);
  }

  confirmComplete(): void {
    const order = this.order();
    if (!order) return;

    this.completingOrder.set(true);
    this.productionService.completeOrder(order.id, { actualQuantity: this.actualQuantity() }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Completada',
          detail: 'Orden de producción completada y stock actualizado.'
        });
        this.showCompleteDialog.set(false);
        this.loadOrder(order.id);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al completar la orden'
        });
        this.completingOrder.set(false);
      }
    });
  }

  onCancelOrder(): void {
    if (!this.order()) return;
    this.cancelReason.set('');
    this.showCancelDialog.set(true);
  }

  confirmCancel(): void {
    const order = this.order();
    if (!order) return;

    this.cancellingOrder.set(true);
    this.productionService.cancelOrder(order.id, this.cancelReason()).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Orden Cancelada',
          detail: 'La orden ha sido cancelada correctamente.'
        });
        this.showCancelDialog.set(false);
        this.loadOrder(order.id);
        this.cancellingOrder.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al cancelar la orden'
        });
        this.cancellingOrder.set(false);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/production/orders']);
  }

  getStatusSeverity(status: ProductionOrderStatus): 'info' | 'warn' | 'success' | 'danger' | 'secondary' {
    switch (status) {
      case 'pending': return 'warn';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusLabel(status: ProductionOrderStatus): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
