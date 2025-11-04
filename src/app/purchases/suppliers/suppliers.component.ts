import { Component, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SuppliersService } from '../services/suppliers.service';
import { TableModule } from 'primeng/table';
import { Supplier } from '../interfaces/supplier.interface';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-suppliers',
  imports: [ButtonModule, TableModule],
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

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading.set(true);
    this.suppliersService.getSuppliers().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.suppliers.set(res.data);
        }
      },
      error: (err) => {},
      complete: () => {
        this.loading.set(false);
      },
    });
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
      reject: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Cancelado',
          detail: 'Se ha cancelado la operación',
        });
      },
    });
  }
}
