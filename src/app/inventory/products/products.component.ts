import { Component, inject, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CurrencyPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from "@angular/forms";
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ProductsService } from '../services/products.service';
import { Product } from '../interfaces/product.interface';

@Component({
  selector: 'app-products',
  imports: [TableModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, CurrencyPipe, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(branchId?: string): void {
    this.loading = true;
    this.productsService.getProducts(branchId).subscribe({
      next: (response) => {
        this.filteredProducts = response.data;
      },
      error: (error) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error cargando los productos: ${error.error.message}`
        });
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    
    return `${environment.baseUrl}${imageUrl}`;
  }

  goToNewProduct() {
    this.router.navigate(['inventory/new-product'])
  }

  onDeleteProduct(product: Product) {
    this.confirmationService.confirm({
      message: `Estás seguro de eliminar el producto: ${product.name}?`,
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
        this.productsService.deleteProduct(product.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Éxito', 
                detail: `El producto se ha eliminado correctamente.`
              });
              this.loadProducts();
            }
          },
          error: (error) => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: `Error eliminando el producto: ${error.error.message}`,
              life: 5000
            });
          }
        })
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Cancelado', detail: 'Se ha cancelado la operación' });
      },
    });
  }
}
