import { Component, inject, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProductsService } from '../services/products.service';
import { Product } from '../interfaces/product.interface';
import { AuthService } from '../../auth/auth.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-products',
  imports: [
    TableModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CurrencyPipe,
    FormsModule,
    ToggleSwitchModule,
    CommonModule,
    TagModule,
    TooltipModule,
    Ripple,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private authService = inject(AuthService);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  searchTerm = '';
  showDeleted = false;

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  expandedRows: { [key: string]: boolean } = {};

  onExpandedRowKeysChange(event: { [key: string]: boolean }) {
    this.expandedRows = event;
  }

  toggleRowExpansion(product: Product) {
    const id = product.id;
    this.expandedRows = {
      ...this.expandedRows,
      [id]: !this.expandedRows[id]
    };
  }

  loadProducts(branchId?: string): void {
    this.loading = true;
    // Excluimos materias primas e insumos de la vista comercial
    this.productsService.getProducts(branchId, this.showDeleted, undefined, undefined).subscribe({
      next: (response) => {
        // En la lista principal solo mostramos productos que NO son variantes
        // ya que las variantes se mostrarán dentro de cada maestro desplegable
        this.filteredProducts = response.data.filter(p => !p.isVariant);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los productos: ${error.error.message}`,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  isDeleted(product: Product): boolean {
    return (product as any).deletedAt != null;
  }

  onRestoreProduct(product: Product): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de restaurar el producto: ${product.name}?`,
      header: 'Confirmar restauración',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.productsService.restoreProduct(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Producto restaurado correctamente',
            });
            this.loadProducts();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar el producto',
            });
          },
        });
      },
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }

  goToNewProduct() {
    this.router.navigate(['inventory/new-product']);
  }

  onEditProduct(productId: string) {
    this.router.navigate(['inventory/edit-product', productId]);
  }

  onCreateVariant(parent: Product) {
    this.router.navigate(['inventory/new-product'], { 
      queryParams: { parentId: parent.id } 
    });
  }

  onDeleteProduct(product: Product) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el producto: ${product.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',

      accept: () => {
        this.productsService.deleteProduct(product.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El producto se ha eliminado correctamente.`,
              });
              this.loadProducts();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando el producto: ${error.error.message}`,
              life: 5000,
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

  getProductTypeLabel(type: string): string {
    switch (type) {
      case 'raw_material':
        return 'Materia Prima';
      case 'insumo':
        return 'Insumo';
      case 'component':
        return 'Componente';
      case 'finished_product':
        return 'Producto Terminado';
      default:
        return 'N/A';
    }
  }

  getTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type) {
      case 'raw_material':
        return 'contrast';
      case 'insumo':
        return 'info';
      case 'component':
        return 'warn';
      case 'finished_product':
        return 'success';
      default:
        return 'secondary';
    }
  }
}
