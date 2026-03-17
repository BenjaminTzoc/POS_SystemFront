import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SuppliersService } from '../services/suppliers.service';
import { TableModule } from 'primeng/table';
import { Supplier } from '../interfaces/supplier.interface';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    ButtonModule,
    TableModule,
    ToggleSwitchModule,
    FormsModule,
    InputTextModule,
    CommonModule,
    TagModule,
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
})
export class SuppliersComponent {
  private suppliersService = inject(SuppliersService);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal<boolean>(false);
  suppliers = signal<Supplier[]>([]);
  includeDeleted = signal<boolean>(false);
  searchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.suppliersService
      .getSuppliers({
        search: this.searchTerm(),
        includeDeleted: this.includeDeleted(),
      })
      .subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.suppliers.set(res.data);
          }
        },
        error: (err) => {
          console.error(err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los proveedores.',
          });
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }

  onSearchChange(): void {
    this.loadSuppliers();
  }

  onToggleDeletedChange(): void {
    this.loadSuppliers();
  }

  createSupplier(): void {
    this.router.navigate(['purchases/new-supplier']);
  }

  editSupplier(supplierId: string): void {
    this.router.navigate(['/purchases/edit-supplier', supplierId]);
  }

  deleteSupplier(supplier: Supplier): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el proveedor: '${supplier.name}'?`,
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
        this.suppliersService.deleteSupplier(supplier.id).subscribe({
          next: (res) => {
            if (res.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El proveedor se ha eliminado correctamente.`,
              });
              this.loadSuppliers();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando el proveedor: ${error.error.message}`,
            });
          },
        });
      },
    });
  }

  restoreSupplier(supplier: Supplier): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de restaurar el proveedor: '${supplier.name}'?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      rejectLabel: 'Cancelar',
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Restaurar',
        severity: 'success',
      },
      accept: () => {
        this.suppliersService.restoreSupplier(supplier.id).subscribe({
          next: (res) => {
            if (res.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El proveedor se ha restaurado correctamente.`,
              });
              this.loadSuppliers();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error restaurando el proveedor: ${error.error.message}`,
            });
          },
        });
      },
    });
  }
}
