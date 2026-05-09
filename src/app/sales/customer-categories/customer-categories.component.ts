import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ICustomerCategory } from '../interfaces/customer.interface';
import { TableModule } from 'primeng/table';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { CustomerCategoriesService } from '../services/customer-categories.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-customer-categories',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    ToggleSwitchModule,
    TagModule,
  ],
  templateUrl: './customer-categories.component.html',
})
export class CustomerCategoriesComponent implements OnInit {
  private router = inject(Router);
  private categoriesService = inject(CustomerCategoriesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  categories: ICustomerCategory[] = [];
  loading = signal<boolean>(false);
  showDeleted: boolean = false;

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    return user?.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.categoriesService.getCategories(this.showDeleted).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.categories = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las categorías: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  goToNewCategory() {
    this.router.navigate(['/sales/customer-categories/new']);
  }

  onEditCategory(id: string): void {
    this.router.navigate(['/sales/customer-categories/edit', id]);
  }

  onDeleteCategory(category: ICustomerCategory) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la categoría: ${category.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.categoriesService.deleteCategory(category.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `La categoría se ha eliminado correctamente.`,
            });
            this.loadCategories();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando la categoría: ${error.error.message}`,
            });
          },
        });
      },
    });
  }

  isDeleted(category: ICustomerCategory): boolean {
    return !!category.deletedAt;
  }

  restoreCategory(category: ICustomerCategory): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de restaurar la categoría: ${category.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.categoriesService.restoreCategory(category.id).subscribe({
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

  onToggleActive(category: ICustomerCategory): void {
    const newStatus = !category.isActive;
    this.categoriesService.updateCategory(category.id, { isActive: newStatus }).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: `Categoría ${category.name} ${newStatus ? 'activada' : 'desactivada'}`,
          });
          // Actualizar localmente para evitar recarga completa si se desea, 
          // o recargar para asegurar sincronía
          category.isActive = newStatus;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar el estado de la categoría',
        });
      },
    });
  }
}
