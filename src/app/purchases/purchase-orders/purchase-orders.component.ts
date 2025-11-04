import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IPurchaseOrderResponse } from '../interfaces/purchase-order.interface';
import { OrdersService } from '../services/orders.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseStatusPipe } from '../../shared/pipes/purchase-status.pipe';

@Component({
  selector: 'app-purchase-orders',
  imports: [ButtonModule, TableModule, DatePipe, CurrencyPipe, PurchaseStatusPipe],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css'
})
export class PurchaseOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  purchaseOrders = signal<IPurchaseOrderResponse[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders(): void {
    this.loading.set(true);

    this.ordersService.getPurchases().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseOrders.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error cargando los productos: ${err.error.message}`
        });
      },
      complete: () => {
        this.loading.set(false);
      }
    })
  }

  createPurchaseOrder(): void {
    this.router.navigate(['/purchases/new-order']);
  }
}
