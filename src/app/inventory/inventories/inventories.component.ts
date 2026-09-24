import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { InventoryService } from '../services/inventory.service';
import { Inventory } from '../interfaces/inventory.interface';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../services/branches.service';
import { Branch } from '../interfaces/branch.interface';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../shared/components/secondary-button/secondary-button.component';
import { BranchSelectComponent } from '../../shared/components/branch-select/branch-select.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardModalComponent } from '../../shared/components/standard-modal/standard-modal.component';
import { InventoryMovementsComponent } from '../inventory-movements/inventory-movements.component';
import { InventoryFormComponent } from './inventory-form/inventory-form.component';

@Component({
  selector: 'app-inventories',
  imports: [
    ButtonModule,
    TableModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    CommonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    TooltipModule,
    ConfirmationModalComponent,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    BranchSelectComponent,
    SearchInputComponent,
    StandardModalComponent,
    InventoryMovementsComponent,
    InventoryFormComponent,
  ],
  templateUrl: './inventories.component.html',
  styleUrl: './inventories.component.css',
})
export class InventoriesComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  inventories: Inventory[] = [];
  branches: Branch[] = [];
  selectedBranchId: string | undefined;
  searchTerm: string = '';
  loading = false;
  isSuperAdmin = false;
  showMovementsModal = false;
  showNewInventoryModal = false;
  showDeleteConfirmModal = false;
  inventoryToDelete: Inventory | null = null;
  isDeletingInventory = false;

  get groupedInventories() {
    const filtered = this.inventories.filter(
      (inv) =>
        inv.product?.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        inv.product?.sku.toLowerCase().includes(this.searchTerm.toLowerCase()),
    );

    const groups = filtered.reduce(
      (acc, inventory) => {
        const branchName = inventory.branchName || inventory.branch?.name || 'Desconocida';
        if (!acc[branchName]) {
          acc[branchName] = [];
        }
        acc[branchName].push(inventory);
        return acc;
      },
      {} as Record<string, Inventory[]>,
    );

    return Object.keys(groups)
      .sort()
      .map((branch) => ({
        branch,
        items: groups[branch],
      }));
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadBranches();
    this.loadInventories();
  }

  checkUserRole() {
    this.isSuperAdmin = this.authService.hasPermission('products.manage_global_stock'); // O la lógica que defina superadmin
    // Alternativamente usar la lógica que vimos en AuthService
    const user = this.authService.currentUser;
    if (user?.roles?.some((r) => r.isSuperAdmin)) {
      this.isSuperAdmin = true;
    }

    if (!this.isSuperAdmin) {
      // Intentar obtener la sucursal del usuario
      // Asumiendo que user tiene branchId o similar. Si no, esto podría fallar si no ajustamos el modelo.
      // Usaremos 'any' para evitar error de compilación si la interfaz no está al día
      const userAny = user as any;
      if (userAny.branchId) {
        this.selectedBranchId = userAny.branchId;
      } else if (userAny.branch?.id) {
        this.selectedBranchId = userAny.branch.id;
      }
    }
  }

  loadBranches() {
    this.branchesService.getBranches({ minimal: true }).subscribe({
      next: (response) => {
        this.branches = response.data;
      },
      error: (error) => {
        console.error('Error loading branches', error);
      },
    });
  }

  loadInventories(): void {
    this.loading = true;
    const request$ = this.selectedBranchId
      ? this.inventoryService.getInventoriesByBranch(this.selectedBranchId)
      : this.inventoryService.getInventories();

    request$.subscribe({
      next: (response) => {
        this.inventories = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los inventarios: ${error.error.message}`,
        });
      },
    });
  }

  onDeleteInventory(inventory: Inventory) {
    this.inventoryToDelete = inventory;
    this.showDeleteConfirmModal = true;
  }

  executeDeleteInventory() {
    if (!this.inventoryToDelete?.id || this.isDeletingInventory) return;
    this.isDeletingInventory = true;
    this.inventoryService.deleteInventory(this.inventoryToDelete.id).subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El inventario se ha eliminado correctamente.`,
          });
          this.showDeleteConfirmModal = false;
          this.isDeletingInventory = false;
          this.inventoryToDelete = null;
          this.loadInventories();
        }
      },
      error: (error) => {
        this.isDeletingInventory = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error eliminando el inventario: ${error.error.message}`,
        });
      },
    });
  }

  createNewInventory() {
    this.showNewInventoryModal = true;
  }

  onInventorySaved() {
    this.showNewInventoryModal = false;
    this.loadInventories();
  }

  goToMovements() {
    this.showMovementsModal = true;
  }

  toggleInventoryAvailability(inventory: Inventory, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const newStatus = inventory.isAvailable === false ? true : false;
    this.inventoryService.updateInventory(inventory.id, { isAvailable: newStatus }).subscribe({
      next: () => {
        inventory.isAvailable = newStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Disponibilidad actualizada',
          detail: `Producto marcado como ${newStatus ? 'Disponible' : 'No disponible'} en esta sucursal.`,
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo actualizar la disponibilidad: ${error.error?.message || error.message || 'Error desconocido'}`,
        });
      },
    });
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return `${environment.baseUrl}/uploads/products/default-product.png`;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${environment.baseUrl}${imageUrl}`;
  }

  getStockStatus(inventory: Inventory): { textClass: string; label: string; iconClass: string; icon: string } {
    if (inventory.product?.manageStock === false) {
      return {
        textClass: 'text-slate-600',
        label: 'Sin Control',
        iconClass: 'text-slate-400 bg-white border-[#48021C]/15',
        icon: 'pi pi-ban'
      };
    }

    const stock = Number(inventory.stock) || 0;
    const minStock = inventory.minStock !== undefined && inventory.minStock !== null ? Number(inventory.minStock) : 5;

    if (stock <= 0) {
      return {
        textClass: 'text-[#9f1239]',
        label: 'Agotado',
        iconClass: 'text-[#9f1239] bg-rose-50 border-[#9f1239]/30',
        icon: 'pi pi-exclamation-circle'
      };
    }

    if (stock <= minStock) {
      return {
        textClass: 'text-[#92400e]',
        label: 'Stock Bajo',
        iconClass: 'text-[#92400e] bg-amber-50 border-[#92400e]/30',
        icon: 'pi pi-exclamation-triangle'
      };
    }

    return {
      textClass: 'text-[#14532d]',
      label: 'En stock',
      iconClass: 'text-[#14532d] bg-emerald-50/70 border-[#14532d]/30',
      icon: 'pi pi-box'
    };
  }
}
