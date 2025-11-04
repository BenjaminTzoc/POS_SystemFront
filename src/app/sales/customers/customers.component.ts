import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ICustomer } from '../interfaces/customer.interface';
import { CustomersService } from '../services/customers.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-customers',
  imports: [ButtonModule, TableModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css'
})
export class CustomersComponent implements OnInit {
  private customersService = inject(CustomersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  customers = signal<ICustomer[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.customersService.getCustomers().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.customers.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error cargando los clientes: ${err.error.message}`
        });
      },
      complete: () => {
        this.loading.set(false);
      }
    })
  }

  createCustomer(): void {
    this.router.navigate(['sales/new-customer']);
  }

  deleteCustomer(customer: ICustomer): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar al cliente: '${customer.name}'?`,
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
