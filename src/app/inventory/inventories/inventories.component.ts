import { Component, inject, OnInit } from '@angular/core';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { InventoryService } from '../services/inventory.service';
import { Inventory } from '../interfaces/inventory.interface';

@Component({
  selector: 'app-inventories',
  imports: [Button, TableModule, CurrencyPipe, DatePipe],
  templateUrl: './inventories.component.html',
  styleUrl: './inventories.component.css',
})
export class InventoriesComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  inventories: Inventory[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadInventories();
  }

  loadInventories(): void {
    this.inventoryService.getInventories().subscribe({
      next: (response) => {
        this.inventories = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las sucursales: ${error.error.message}`,
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
    this.router.navigate(['inventory/new-inventory'])
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
