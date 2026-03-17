import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { IPurchaseOrderResponse } from '../interfaces/purchase-order.interface';
import { OrdersService } from '../services/orders.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PurchaseStatusPipe } from '../../shared/pipes/purchase-status.pipe';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { DialogModule } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/auth.service';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    DatePipe,
    CurrencyPipe,
    PurchaseStatusPipe,
    DialogModule,
    Select,
    FormsModule,
    CommonModule,
    TooltipModule,
    InputTextModule,
    TagModule
  ],
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.css',
})
export class PurchaseOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);

  purchaseOrders = signal<IPurchaseOrderResponse[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal<boolean>(false);

  // Recepcion logic
  showReceiveDialog = signal<boolean>(false);
  currentOrderToReceive = signal<IPurchaseOrderResponse | null>(null);
  selectedBranchId = signal<string | null>(null);
  receivingStock = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPurchaseOrders();
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
          // Pre-select if only 1 branch or based on user (logic can be refined)
          if (res.data.length === 1) {
            this.selectedBranchId.set(res.data[0].id);
          }
        }
      },
    });
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
          detail: `Error cargando los productos: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  createPurchaseOrder(): void {
    this.router.navigate(['/purchases/new-order']);
  }

  openReceiveDialog(order: IPurchaseOrderResponse): void {
    this.currentOrderToReceive.set(order);
    this.showReceiveDialog.set(true);
  }

  confirmReceive(): void {
    const order = this.currentOrderToReceive();
    const branchId = this.selectedBranchId();

    if (!order || !branchId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar una sucursal para recibir.',
      });
      return;
    }

    this.receivingStock.set(true);
    this.ordersService.receiveStock(order.id, branchId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'El stock ha sido recibido correctamente.',
          });
          this.showReceiveDialog.set(false);
          this.loadPurchaseOrders();
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al recibir el stock: ${err.error?.message || err.message}`,
        });
      },
      complete: () => {
        this.receivingStock.set(false);
      },
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'received': return 'success';
      case 'pending': return 'warn';
      case 'partially_received': return 'info';
      case 'OPEN': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }
}
