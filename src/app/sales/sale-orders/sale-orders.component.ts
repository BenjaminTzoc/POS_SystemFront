import { Component, inject, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { OrdersService, SaleFilterDto } from '../services/orders.service';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';
import { SaleFolderDto } from '../interfaces/sale-folder.interface';
import { SaleFoldersService } from '../services/sale-folders.service';
import { CurrencyPipe, DatePipe, DecimalPipe, NgClass } from '@angular/common';
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
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { LucideCirclePlus, LucideRefreshCw, LucideSquarePen, LucideReceipt, LucideEye } from '@lucide/angular';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StandardModalComponent } from '../../shared/components/standard-modal/standard-modal.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { BranchSelectComponent } from '../../shared/components/branch-select/branch-select.component';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPreview, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

const FOLDER_COLORS = ['#48021C', '#c2410c', '#1B768E', '#15803d', '#7c3aed', '#d97706', '#be123c', '#0f766e'];

@Component({
  selector: 'app-sale-orders',
  standalone: true,
  imports: [
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    ButtonModule, 
    TableModule, 
    DatePipe, 
    CurrencyPipe, 
    DecimalPipe,
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
    DialogModule,
    StandardModalComponent,
    ConfirmationModalComponent,
    BranchSelectComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
  ],
  templateUrl: './sale-orders.component.html',
  styleUrl: './sale-orders.component.css',
})
export class SaleOrdersComponent implements OnInit, OnDestroy {
  private ordersService = inject(OrdersService);
  private foldersService = inject(SaleFoldersService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);
  private areasService = inject(AreasService);
  private saleWsService = inject(SaleOrderWsService);

  readonly folderColors = FOLDER_COLORS;
  canManageFolders = computed(() => this.authService.hasPermission('orders.update'));
  folders = signal<SaleFolderDto[]>([]);
  selectedFolderId = signal<string | null>(null);
  folderDropIds = computed(() => this.folders().map((f) => `folder-drop-${f.id}`));

  folderModalVisible = signal(false);
  folderSaving = signal(false);
  editingFolder = signal<SaleFolderDto | null>(null);
  folderName = signal('');
  folderColor = signal(FOLDER_COLORS[0]);
  folderBranchId = signal<string | null>(null);

  deleteFolderVisible = signal(false);
  folderToDelete = signal<SaleFolderDto | null>(null);
  folderDeleting = signal(false);

  addToFolderVisible = signal(false);
  addToFolderOrder = signal<ISaleOrderResponse | null>(null);
  addToFolderSaving = signal(false);

  private allOrders = signal<ISaleOrderResponse[]>([]);

  private subscriptions: Subscription[] = [];
  searchTerm = signal<string>('');
  
  // Pagination
  totalRecords = signal<number>(0);
  rows = signal<number>(50);
  first = signal<number>(0);

  selectedBranch = signal<string | null>(null);
  selectedArea = signal<string | null>(null);
  preorderFilter = signal<'all' | 'preorder' | 'regular'>('all');
  promisedDeliveryRange = signal<Date[] | null>(null);
  preorderFilterOptions = [
    { label: 'Todas las órdenes', value: 'all' },
    { label: 'Solo preórdenes', value: 'preorder' },
    { label: 'Sin preórdenes', value: 'regular' },
  ];
  selectedStatus = signal<string | null>(null);
  statusFilterOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Confirmado', value: 'confirmed' },
    { label: 'En Preparación', value: 'preparing' },
    { label: 'Listo para recoger', value: 'ready_for_pickup' },
    { label: 'En camino', value: 'out_for_delivery' },
    { label: 'Entregado', value: 'delivered' },
    { label: 'Parcialmente entregado', value: 'partially_delivered' },
    { label: 'En espera', value: 'on_hold' },
    { label: 'Cancelado', value: 'cancelled' },
  ];
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
    this.loadBranches();
    this.loadAreas();
    this.loadFolders();
    this.setupWebSockets();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  setupWebSockets(): void {
    this.subscriptions.push(
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

  resetFilters(): void {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    this.dateRange.set([start, new Date()]);
    this.selectedBranch.set(null);
    this.selectedArea.set(null);
    this.preorderFilter.set('all');
    this.promisedDeliveryRange.set(null);
    this.selectedStatus.set(null);
    this.searchTerm.set('');
    this.selectedFolderId.set(null);
    this.first.set(0);
    this.loadOrders();
  }

  onPageChange(event: any): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    this.loadOrders();
  }

  refreshAll(): void {
    this.loadFolders();
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    
    const dates = this.dateRange();
    const currentAreaId = this.selectedArea();
    const currentOnlyAreaDetails = !!currentAreaId || this.onlyAreaDetails();
    const preorderFilter = this.preorderFilter();
    const deliveryRange = this.promisedDeliveryRange();
    
    const filters: SaleFilterDto = {
      branchId: this.selectedBranch(),
      areaId: currentAreaId ?? undefined,
      onlyAreaDetails: currentOnlyAreaDetails,
      status: this.selectedStatus() ?? undefined,
      search: this.searchTerm(),
      page: (this.first() / this.rows()) + 1,
      limit: this.rows(),
      folderId: this.selectedFolderId() ?? undefined,
    };

    if (preorderFilter === 'preorder') {
      filters.isPreorder = true;
      if (deliveryRange?.[0]) {
        filters.promisedDeliveryStart = deliveryRange[0].toISOString().split('T')[0];
        filters.promisedDeliveryEnd = (deliveryRange[1] || deliveryRange[0]).toISOString().split('T')[0];
      }
    } else {
      if (preorderFilter === 'regular') {
        filters.isPreorder = false;
      }
      if (!this.selectedFolderId()) {
        filters.startDate = dates[0]?.toISOString().split('T')[0];
        filters.endDate = (dates[1] || dates[0])?.toISOString().split('T')[0];
      }
    }

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

  onBranchChange(): void {
    this.selectedFolderId.set(null);
    this.first.set(0);
    this.loadFolders();
    this.loadOrders();
  }

  loadFolders(): void {
    const branchId = this.isSuperAdmin() ? this.selectedBranch() : null;
    this.foldersService.list(branchId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.folders.set(res.data ?? []);
        }
      },
      error: (err) => this.handleFolderError(err, 'No se pudieron cargar las carpetas'),
    });
  }

  selectFolder(id: string | null): void {
    this.selectedFolderId.set(id);
    this.first.set(0);
    this.loadOrders();
  }

  openCreateFolder(): void {
    this.editingFolder.set(null);
    this.folderName.set('');
    this.folderColor.set(FOLDER_COLORS[0]);
    this.folderBranchId.set(null);
    this.folderModalVisible.set(true);
  }

  openEditFolder(folder: SaleFolderDto, event?: Event): void {
    event?.stopPropagation();
    this.editingFolder.set(folder);
    this.folderName.set(folder.name);
    this.folderColor.set(folder.color || FOLDER_COLORS[0]);
    this.folderModalVisible.set(true);
  }

  saveFolder(): void {
    const name = this.folderName().trim();
    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre', detail: 'Escribe un nombre para la carpeta.' });
      return;
    }
    const editing = this.editingFolder();
    if (!editing && this.isSuperAdmin() && !this.folderBranchId()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sucursal',
        detail: 'Elige una sucursal para la carpeta.',
      });
      return;
    }
    this.folderSaving.set(true);
    const req = editing
      ? this.foldersService.update(editing.id, { name, color: this.folderColor() })
      : this.foldersService.create({
          name,
          color: this.folderColor(),
          branchId: this.isSuperAdmin() ? this.folderBranchId() ?? undefined : undefined,
        });

    req.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: editing ? 'Carpeta actualizada' : 'Carpeta creada',
          detail: name,
        });
        this.folderModalVisible.set(false);
        this.folderSaving.set(false);
        this.loadFolders();
      },
      error: (err) => {
        this.folderSaving.set(false);
        this.handleFolderError(err, 'No se pudo guardar la carpeta');
      },
    });
  }

  askDeleteFolder(folder: SaleFolderDto, event?: Event): void {
    event?.stopPropagation();
    this.folderToDelete.set(folder);
    this.deleteFolderVisible.set(true);
  }

  confirmDeleteFolder(): void {
    const folder = this.folderToDelete();
    if (!folder) return;
    this.folderDeleting.set(true);
    this.foldersService.delete(folder.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Carpeta eliminada', detail: folder.name });
        if (this.selectedFolderId() === folder.id) this.selectedFolderId.set(null);
        this.folderDeleting.set(false);
        this.deleteFolderVisible.set(false);
        this.folderToDelete.set(null);
        this.loadFolders();
        this.loadOrders();
      },
      error: (err) => {
        this.folderDeleting.set(false);
        this.handleFolderError(err, 'No se pudo eliminar la carpeta');
      },
    });
  }

  openAddToFolder(order: ISaleOrderResponse, event?: Event): void {
    event?.stopPropagation();
    this.addToFolderOrder.set(order);
    this.addToFolderVisible.set(true);
  }

  addOrderToFolder(folder: SaleFolderDto): void {
    const order = this.addToFolderOrder();
    if (!order) return;
    this.addToFolderSaving.set(true);
    this.foldersService.addSales(folder.id, { saleIds: [order.id] }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Añadida',
          detail: `#${order.invoiceNumber} en ${folder.name}`,
        });
        this.addToFolderSaving.set(false);
        this.addToFolderVisible.set(false);
        this.addToFolderOrder.set(null);
        this.loadFolders();
      },
      error: (err) => {
        this.addToFolderSaving.set(false);
        this.handleFolderError(err, 'No se pudo añadir a la carpeta');
      },
    });
  }

  removeFromActiveFolder(order: ISaleOrderResponse, event?: Event): void {
    event?.stopPropagation();
    const folderId = this.selectedFolderId();
    if (!folderId) return;
    this.foldersService.removeSale(folderId, order.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Quitada',
          detail: `#${order.invoiceNumber} salió de la carpeta`,
        });
        this.loadFolders();
        this.loadOrders();
      },
      error: (err) => this.handleFolderError(err, 'No se pudo quitar de la carpeta'),
    });
  }

  onDropOnFolder(event: CdkDragDrop<SaleFolderDto>, folder: SaleFolderDto): void {
    const order = event.item.data as ISaleOrderResponse | undefined;
    if (!order?.id) return;
    this.foldersService.addSales(folder.id, { saleIds: [order.id] }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Añadida',
          detail: `#${order.invoiceNumber} en ${folder.name}`,
        });
        this.loadFolders();
        if (this.selectedFolderId() === folder.id) this.loadOrders();
      },
      error: (err) => this.handleFolderError(err, 'No se pudo añadir a la carpeta'),
    });
  }

  onOrdersListDrop(event: CdkDragDrop<ISaleOrderResponse[]>): void {
    if (event.previousContainer !== event.container) return;
    const folderId = this.selectedFolderId();
    if (!folderId || event.previousIndex === event.currentIndex) return;

    const list = [...this.allOrders()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.allOrders.set(list);
    const offset = this.first();
    this.foldersService
      .reorder(folderId, {
        items: list.map((order, index) => ({ saleId: order.id, sortOrder: offset + index })),
      })
      .subscribe({
        error: (err) => this.handleFolderError(err, 'No se pudo reordenar la carpeta'),
      });
  }

  private handleFolderError(err: any, fallback: string): void {
    const raw = err?.error?.message;
    const detail = Array.isArray(raw) ? raw.join('. ') : (typeof raw === 'string' ? raw : fallback);
    this.messageService.add({ severity: 'error', summary: 'Carpetas', detail });
  }

  private handleError(err: any): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Error cargando las órdenes de venta: ${err.error?.message || 'Error desconocido'}`,
    });
  }

  getStatusSeverity(status?: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
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

  toggleRowExpansion(order: ISaleOrderResponse, standardTable: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const dt = standardTable?.dataTable;
    if (dt) {
      dt.toggleRow(order);
    }
  }

  previewOrder(order: ISaleOrderResponse): void {
    this.selectedOrderForPreview.set(order);
    this.showTicketPreview.set(true);
  }

  showDetails(order: ISaleOrderResponse): void {
    this.selectedOrder = order;
    this.displayDetails = true;
  }

  editOrder(orderId: string): void {
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

  getGroupedDetails(order: ISaleOrderResponse) {
    if (!order || !order.details) return [];

    const groups: {
      productId: string;
      productName: string;
      sku: string;
      unitAbbreviation: string;
      unitPrice: number;
      items: any[];
      totalQuantity: number;
      totalAmount: number;
    }[] = [];

    order.details.forEach((item) => {
      const prodId = item.product?.id || item.product?.name || '';
      let group = groups.find((g) => g.productId === prodId);
      if (!group) {
        group = {
          productId: prodId,
          productName: item.product?.name || 'Producto',
          sku: item.product?.sku || '---',
          unitAbbreviation: item.product?.unit?.abbreviation || 'U',
          unitPrice: Number(item.unitPrice || 0),
          items: [],
          totalQuantity: 0,
          totalAmount: 0,
        };
        groups.push(group);
      }
      group.items.push(item);
      group.totalQuantity += Number(item.quantity || 0);
      group.totalAmount += Number(item.lineTotal || 0);
    });

    return groups.sort((a, b) =>
      a.productName.localeCompare(b.productName, 'es', { sensitivity: 'base' })
    );
  }
}
