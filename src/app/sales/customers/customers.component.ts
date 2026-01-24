import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ICustomer } from '../interfaces/customer.interface';
import { CustomersService } from '../services/customers.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-customers',
  imports: [
    ButtonModule,
    TableModule,
    DatePipe,
    CommonModule,
    ToggleSwitchModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
})
export class CustomersComponent implements OnInit {
  private customersService = inject(CustomersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private authService = inject(AuthService);

  allCustomers: ICustomer[] = [];
  filteredCustomers: ICustomer[] = [];
  loading = false;
  showDeleted = false;
  searchTerm = '';

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customersService.getCustomers(this.showDeleted).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.filteredCustomers = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los clientes: ${err.error.message}`,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  createCustomer(): void {
    this.router.navigate(['sales/new-customer']);
  }

  editCustomer(customerId: string): void {
    this.router.navigate(['/sales/edit-customer', customerId]);
  }

  isDeleted(customer: ICustomer): boolean {
    return (customer as any).deletedAt != null;
  }

  deleteCustomer(customer: ICustomer): void {
    const isActuallyDeleted = this.isDeleted(customer);
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar al cliente: '${customer.name}'?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',

      accept: () => {
        this.customersService.deleteCustomer(customer.id).subscribe({
          next: (res) => {
            if (res.statusCode === 200) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `El cliente se ha eliminado correctamente.`,
              });
              this.loadCustomers();
            }
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error eliminando al cliente: ${error.error.message}`,
            });
          },
        });
      },
    });
  }

  onRestoreCustomer(customer: ICustomer): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de restaurar al cliente: ${customer.name}?`,
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',
      accept: () => {
        this.customersService.restoreCustomer(customer.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Cliente restaurado correctamente',
            });
            this.loadCustomers();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar el cliente',
            });
          },
        });
      },
    });
  }
}
