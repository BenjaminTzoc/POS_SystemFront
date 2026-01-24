import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Category } from '../interfaces/product.interface';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProductsService } from '../services/products.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-product-categories',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DatePipe,
    FormsModule,
    ToggleSwitchModule,
  ],
  templateUrl: './product-categories.component.html',
  styleUrl: './product-categories.component.css',
})
export class ProductCategoriesComponent implements OnInit {
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  categories: Category[] = [];
  loading = signal<boolean>(false);
  showDeleted: boolean = false;

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);

    this.productsService.getCategories(this.showDeleted).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.categories = res.data;
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

  goToNewCategory() {
    this.router.navigate(['inventory/new-category']);
  }

  onEditCategory(categoryId: string): void {
    this.router.navigate(['inventory/edit-category', categoryId]);
  }

  onDeleteCategory(category: Category) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría: ${category.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.productsService.deleteCategory(category.id).subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `La categoría se ha eliminado correctamente.`,
              });
              this.loadCategories();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando la categoría: ${error.error.message}`,
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

  isDeleted(category: Category): boolean {
    return category.deletedAt != null;
  }

  restoreCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de restaurar la categoría: ${category.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.productsService.restoreCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Categoría restaurada correctamente',
            });
            this.loadCategories();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar la categoría',
            });
          },
        });
      },
    });
  }
}
