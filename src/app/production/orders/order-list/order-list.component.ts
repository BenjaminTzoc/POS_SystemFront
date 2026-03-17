import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { ProductionOrderService } from '../../services/production-order.service';
import { IProductionOrder, ProductionOrderStatus } from '../../interfaces/production-order.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-production-order-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    FormsModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './order-list.component.html'
})
export class ProductionOrderListComponent implements OnInit {
  private productionService = inject(ProductionOrderService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  orders = signal<IProductionOrder[]>([]);
  loading = signal<boolean>(false);

  // Completion Dialog
  showCompleteDialog = signal<boolean>(false);
  selectedOrder = signal<IProductionOrder | null>(null);
  actualQuantity = signal<number>(0);
  completingOrder = signal<boolean>(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.productionService.getOrders().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.orders.set(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las órdenes de producción'
        });
        this.loading.set(false);
      }
    });
  }

  createOrder(): void {
    this.router.navigate(['/production/orders/new']);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/production/orders/detail', id]);
  }

  onComplete(order: IProductionOrder): void {
    this.selectedOrder.set(order);
    this.actualQuantity.set(order.plannedQuantity);
    this.showCompleteDialog.set(true);
  }

  confirmComplete(): void {
    const order = this.selectedOrder();
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
        this.loadOrders();
        this.completingOrder.set(false);
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
