import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { OrdersService, SaleFilterDto } from '../services/orders.service';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse, ISaleGroupedByStatus, ISaleGroupedByPreparation, IGroupedItem } from '../interfaces/sale-order.interface';
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
import { SelectButtonModule } from 'primeng/selectbutton';
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
    SelectButtonModule,
    ToggleSwitchModule,
    TagModule,
    SaleStatusPipe,
    TicketPreviewComponent,
    CommonModule,
    RippleModule
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
  private groupedByStatus = signal<ISaleGroupedByStatus | null>(null);
  private groupedByPreparation = signal<ISaleGroupedByPreparation | null>(null);

  private subscriptions: Subscription[] = [];
  searchTerm = signal<string>('');
  
  // Filters
  groupBy = signal<'status' | 'preparationStatus'>('status');
  viewMode = signal<'table' | 'kanban'>('table');
  viewOptions = [
    { label: 'Tabla', value: 'table', icon: 'pi pi-table' },
    { label: 'Kanban', value: 'kanban', icon: 'pi pi-th-large' }
  ];

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

  kanbanColumns = computed(() => {
    if (this.groupBy() === 'preparationStatus') {
      return [
        { label: 'Pendientes', statuses: ['pending'], color: 'amber', icon: 'pi-clock' },
        { label: 'En Preparación', statuses: ['preparing'], color: 'indigo', icon: 'pi-cog' },
        { label: 'Completados', statuses: ['completed'], color: 'emerald', icon: 'pi-check-circle' },
      ];
    }
    return [
      { label: 'Pendientes', statuses: ['pending', 'on_hold'], color: 'amber', icon: 'pi-clock' },
      { label: 'Confirmados', statuses: ['confirmed'], color: 'blue', icon: 'pi-check-circle' },
      { label: 'En Preparación', statuses: ['preparing'], color: 'indigo', icon: 'pi-cog' },
      { label: 'Listos', statuses: ['ready_for_pickup'], color: 'emerald', icon: 'pi-check' },
      { label: 'Entregados', statuses: ['delivered', 'out_for_delivery', 'partially_delivered'], color: 'slate', icon: 'pi-truck' },
    ];
  });

  getOrdersForColumn(statuses: string[]) {
    if (this.groupBy() === 'status') {
      const grouped = this.groupedByStatus();
      if (!grouped) return [];
      
      return statuses.reduce((acc, status) => {
        const data = grouped[status]?.orders || [];
        return [...acc, ...data];
      }, [] as ISaleOrderResponse[]);
    }
    return [];
  }

  getItemsForColumn(statuses: string[]) {
    if (this.groupBy() === 'preparationStatus') {
      const grouped = this.groupedByPreparation();
      if (!grouped) return [];

      return statuses.reduce((acc, status) => {
        const data = grouped[status]?.items || [];
        return [...acc, ...data];
      }, [] as IGroupedItem[]);
    }
    return [];
  }

  getColumnTotal(statuses: string[]) {
    if (this.groupBy() === 'status') {
      const grouped = this.groupedByStatus();
      if (!grouped) return 0;
      return statuses.reduce((acc, status) => acc + (grouped[status]?.total || 0), 0);
    }
    
    const groupedPrep = this.groupedByPreparation();
    if (!groupedPrep) return 0;
    return statuses.reduce((acc, status) => acc + (groupedPrep[status]?.total || 0), 0);
  }

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
    
    const currentViewMode = this.viewMode();
    const dates = this.dateRange();
    const currentAreaId = this.selectedArea();
    const currentOnlyAreaDetails = !!currentAreaId || this.onlyAreaDetails();
    
    // Si hay un área seleccionada, usualmente queremos el agrupamiento por preparación en Kanban
    const currentGroupBy = currentAreaId ? 'preparationStatus' : 'status';
    this.groupBy.set(currentGroupBy);

    const filters: SaleFilterDto = {
      groupBy: currentGroupBy,
      branchId: this.selectedBranch(),
      areaId: currentAreaId ?? undefined,
      onlyAreaDetails: currentOnlyAreaDetails,
      startDate: dates[0]?.toISOString().split('T')[0],
      endDate: (dates[1] || dates[0])?.toISOString().split('T')[0],
      search: this.searchTerm(),
      page: (this.first() / this.rows()) + 1,
      limit: this.rows()
    };

    if (currentViewMode === 'table') {
      this.ordersService.getSalesTable(filters).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.allOrders.set(res.data.data);
            this.totalRecords.set(res.data.total);
            this.groupedByStatus.set(null);
            this.groupedByPreparation.set(null);
          }
        },
        error: (err) => this.handleError(err),
        complete: () => this.loading.set(false)
      });
    } else {
      this.ordersService.getSalesKanban(filters).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            if (currentGroupBy === 'status') {
              this.groupedByStatus.set(res.data as ISaleGroupedByStatus);
              this.groupedByPreparation.set(null);
              this.allOrders.set([]);
            } else {
              this.groupedByPreparation.set(res.data as ISaleGroupedByPreparation);
              this.groupedByStatus.set(null);
              this.allOrders.set([]);
            }
            this.totalRecords.set(0); // Kanban doesn't use standard pagination meta here usually
          }
        },
        error: (err) => this.handleError(err),
        complete: () => this.loading.set(false)
      });
    }
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
