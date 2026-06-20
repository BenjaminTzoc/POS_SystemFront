import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { OrdersService, SaleFilterDto } from '../services/orders.service';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { RippleModule } from 'primeng/ripple';
import { AreasService } from '../../logistics/services/areas.service';
import { Area } from '../../logistics/interfaces/area.interface';
import { SaleOrderWsService } from '../services/sale-order-ws.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { Subscription } from 'rxjs';
import { SaleStatusPipe } from '../../shared/pipes/sale-status.pipe';
import { TicketPreviewComponent } from './ticket-preview/ticket-preview.component';
import { CommonModule } from '@angular/common';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-sale-orders',
  standalone: true,
  imports: [
    ButtonModule, 
    TableModule, 
    DatePipe, 
    CurrencyPipe, 
    NgClass, 
    TooltipModule, 
    InputTextModule,
    SelectModule,
    DatePickerModule,
    FormsModule,
    ToggleSwitchModule,
    TagModule,
    SaleStatusPipe,
    TicketPreviewComponent,
    CommonModule,
    RippleModule,
    IconFieldModule,
    InputIconModule,
    DialogModule
  ],
  templateUrl: './sale-orders.component.html',
  styleUrl: './sale-orders.component.css',
})
export class SaleOrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);
  private areasService = inject(AreasService);
  private saleWsService = inject(SaleOrderWsService);

  private allOrders = signal<ISaleOrderResponse[]>([]);

  private subscriptions: Subscription[] = [];
  searchTerm = signal<string>('');
  
  // Pagination
  totalRecords = signal<number>(0);
  rows = signal<number>(50);
  first = signal<number>(0);

  selectedBranch = signal<string | null>(null);
  selectedArea = signal<string | null>(null);
  onlyAreaDetails = signal<boolean>(false);
  expandedOrders = signal<Set<string>>(new Set());
  showTicketPreview = signal<boolean>(false);
  selectedOrderForPreview = signal<ISaleOrderResponse | null>(null);
  expandedRows = signal<any>({});
  
  displayDetails = false;
  selectedOrder: ISaleOrderResponse | null = null;

  // ... rest of signals
  dateRange = signal<Date[]>( (() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    return [start, new Date()];
  })());
  branches = signal<Branch[]>([]);
  areas = signal<Area[]>([]);
  isSuperAdmin = computed(() => this.authService.currentUser?.roles?.some(r => r.isSuperAdmin) ?? false);

  
  saleOrders = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const orders = this.allOrders();
    
    if (!term) return orders;
    
    return orders.filter(order => 
      order.invoiceNumber?.toLowerCase().includes(term) ||
      order.customer?.name?.toLowerCase().includes(term) ||
      order.guestCustomer?.name?.toLowerCase().includes(term) ||
      order.branch?.name?.toLowerCase().includes(term)
    );
  });



  selectedOrders: any[] = [];
  loading = signal<boolean>(false);

  ngOnInit(): void {
    if (this.isSuperAdmin()) {
      this.loadBranches();
    }
    this.loadAreas();
    this.loadOrders();
    this.setupWebSockets();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  setupWebSockets(): void {
    this.subscriptions.push(
      this.saleWsService.newSaleCreated$.subscribe(() => {
        this.loadOrders();
      }),
      this.saleWsService.newSale$.subscribe(() => {
        this.loadOrders();
      })
    );
  }

  loadAreas(): void {
    this.areasService.getAreas().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.areas.set(res.data);
        }
      }
    });
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
        }
      }
    });
  }

  applySearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.first.set(0); // Reset to first page on search
    this.loadOrders();
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    
    const dates = this.dateRange();
    const currentAreaId = this.selectedArea();
    const currentOnlyAreaDetails = !!currentAreaId || this.onlyAreaDetails();
    
    const filters: SaleFilterDto = {
      branchId: this.selectedBranch(),
      areaId: currentAreaId ?? undefined,
      onlyAreaDetails: currentOnlyAreaDetails,
      startDate: dates[0]?.toISOString().split('T')[0],
      endDate: (dates[1] || dates[0])?.toISOString().split('T')[0],
      search: this.searchTerm(),
      page: (this.first() / this.rows()) + 1,
      limit: this.rows()
    };

    this.ordersService.getSalesTable(filters).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.allOrders.set(res.data.data);
          this.totalRecords.set(res.data.total);
        }
      },
      error: (err) => this.handleError(err),
      complete: () => this.loading.set(false)
    });
  }

  private handleError(err: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Error cargando las órdenes de venta: ${err.error?.message || 'Error desconocido'}`,
    });
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'confirmed': return 'info';
      case 'delivered': return 'success';
      case 'pending': return 'warn';
      case 'cancelled': return 'danger';
      case 'preparing': return 'info';
      case 'on_hold': return 'secondary';
      default: return 'secondary';
    }
  }

  createSaleOrder(): void {
    this.router.navigate(['/sales/new-order']);
  }

  editOrder(orderId: string) {
    this.router.navigate(['/sales/new-order'], {
      queryParams: { id: orderId },
    });
  }

  startPreparing(orderId: string): void {
    this.ordersService.preparingSale(orderId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Orden en preparación' });
        this.loadOrders();
      }
    });
  }

  readyForPickup(orderId: string): void {
    this.ordersService.readyForPickupSale(orderId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Orden lista para recoger' });
        this.loadOrders();
      }
    });
  }

  completeItemDetail(detailId: string, status: 'preparing' | 'completed' = 'completed'): void {
    this.ordersService.updateDetailStatus(detailId, status).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Ítem procesado correctamente' });
        this.loadOrders();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el ítem' });
      }
    });
  }

  toggleDetails(orderId: string): void {
    const next = new Set(this.expandedOrders());
    if (next.has(orderId)) {
      next.delete(orderId);
    } else {
      next.add(orderId);
    }
    this.expandedOrders.set(next);
  }

  isExpanded(orderId: string): boolean {
    // Si estamos en modo "Pantalla de Área" con filtrado estricto, expandir por defecto
    if (this.selectedArea() && this.onlyAreaDetails()) return true;
    return this.expandedOrders().has(orderId);
  }

  showDetails(order: ISaleOrderResponse): void {
    this.selectedOrder = order;
    this.displayDetails = true;
  }

  previewOrder(order: ISaleOrderResponse) {
    this.selectedOrderForPreview.set(order);
    this.showTicketPreview.set(true);
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  calculateTotal(status: string) {
    return this.allOrders().filter(o => o.status === status).length;
  }

  getPaymentPercentage(order: ISaleOrderResponse): number {
    const total = Number(order.total);
    if (total === 0) return 0;
    const paid = Number(order.paidAmount);
    return (paid / total) * 100;
  }

  isAbonada(order: ISaleOrderResponse): boolean {
    return order.status === 'pending' && Number(order.paidAmount) > 0;
  }
}
