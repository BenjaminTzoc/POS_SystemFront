import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { OrdersService } from '../services/orders.service';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SaleStatusPipe } from '../../shared/pipes/sale-status.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sale-orders',
  imports: [ButtonModule, TableModule, DatePipe, SaleStatusPipe, CurrencyPipe],
  templateUrl: './sale-orders.component.html',
  styleUrl: './sale-orders.component.css',
})
export class SaleOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  saleOrders = signal<ISaleOrderResponse[]>([]);
  selectedOrders: any[] = [];
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.ordersService.getSales().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.saleOrders.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las órdenes de venta: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  createSaleOrder(): void {
    this.router.navigate(['/sales/new-order']);
  }

  editOrder(orderId: string) {
    this.router.navigate(['/sales/new-order'], {
      queryParams: { id: orderId },
    });
  }
}
