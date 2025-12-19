import { Component, inject, OnInit } from '@angular/core';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { InventoryService } from '../services/inventory.service';
import { Inventory } from '../interfaces/inventory.interface';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../services/branches.service';
import { Branch } from '../interfaces/branch.interface';

@Component({
  selector: 'app-inventories',
  imports: [Button, TableModule, CurrencyPipe, DatePipe, Select, FormsModule],
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
  loading = false;
  isSuperAdmin = false;

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
    this.branchesService.getBranches().subscribe({
      next: (response) => {
        this.branches = response.data;
      },
      error: (error) => {
        console.error('Error loading branches', error);
      },
    });
  }

  loadInventories(): void {
    const request$ = this.selectedBranchId
      ? this.inventoryService.getInventoriesByBranch(this.selectedBranchId)
      : this.inventoryService.getInventories();

    request$.subscribe({
      next: (response) => {
        console.log(response);
        this.inventories = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los inventarios: ${error.error.message}`,
        });
      },
    });
  }

  onDeleteInventory(inventory: Inventory) {
    this.confirmationService.confirm({
      message: `
          Estás seguro de eliminar el inventario del producto 
          "${inventory.product.name}" de la sucursal "${inventory.branch.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancelar',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Eliminar',
        severity: 'danger',
      },

      accept: () => {
        this.inventoryService.deleteInventory(inventory.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El inventario se ha eliminado correctamente.`,
              });
              this.loadInventories();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando el inventario: ${error.error.message}`,
            });
          },
        });
      },
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'Se ha cancelado la operación',
        });
      },
    });
  }

  createNewInventory() {
    this.router.navigate(['inventory/new-inventory']);
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return `${environment.baseUrl}/uploads/products/default-product.png`;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${environment.baseUrl}${imageUrl}`;
  }
}
