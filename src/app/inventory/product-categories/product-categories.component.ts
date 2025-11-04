import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Category } from '../interfaces/product.interface';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ProductsService } from '../services/products.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-product-categories',
  imports: [ReactiveFormsModule, ButtonModule, TableModule, IconFieldModule, InputIconModule, InputTextModule, DatePipe],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css'
})
export class ProductCategoriesComponent implements OnInit {
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  categories: Category[] = [];
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    this.productsService.getCategories().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.categories = res.data;
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

  goToNewCategory() {
    this.router.navigate(['inventory/new-category'])
  }

  onEditCategory(categoryId: string): void {
    this.router.navigate(['inventory/edit-category', categoryId])
  }

  onDeleteCategory(category: Category) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría: ${category.name}?`,
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
        this.productsService.deleteCategory(category.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({ 
                severity: 'success', 
                summary: 'Éxito', 
                detail: `La categoría se ha eliminado correctamente.`
              });
              this.loadCategories();
            }
          },
          error: (error) => {
            this.messageService.add({ 
              severity: 'error', 
              summary: 'Error', 
              detail: `Error eliminando la categoría: ${error.error.message}`,
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
