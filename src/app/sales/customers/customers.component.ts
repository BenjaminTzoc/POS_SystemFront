import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ICustomer } from '../interfaces/customer.interface';
import { CustomersService } from '../services/customers.service';
import { AuthService } from '../../auth/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    ToggleSwitchModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    RefreshButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './customers.component.html',
})
export class CustomersComponent implements OnInit {
  private customersService = inject(CustomersService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private authService = inject(AuthService);

  allCustomers: ICustomer[] = [];
  filteredCustomers: ICustomer[] = [];
  loading = false;
  showDeleted = false;
  searchTerm = '';

  pendingDelete: ICustomer | null = null;
  pendingRestore: ICustomer | null = null;
  showDeleteModal = false;
  showRestoreModal = false;
  actionLoading = false;

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
          this.allCustomers = res.data ?? [];
          this.applySearch();
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

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applySearch();
  }

  createCustomer(): void {
    this.router.navigate(['sales/new-customer']);
  }

  editCustomer(customerId: string): void {
    this.router.navigate(['/sales/edit-customer', customerId]);
  }

  isDeleted(customer: ICustomer): boolean {
    return customer.deletedAt != null;
  }

  askDelete(customer: ICustomer): void {
    this.pendingDelete = customer;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const customer = this.pendingDelete;
    if (!customer) return;
    this.actionLoading = true;
    this.customersService.deleteCustomer(customer.id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'El cliente se ha eliminado correctamente.',
          });
          this.closeDelete();
          this.loadCustomers();
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error eliminando al cliente: ${error.error.message}`,
        });
        this.actionLoading = false;
      },
    });
  }

  askRestore(customer: ICustomer): void {
    this.pendingRestore = customer;
    this.showRestoreModal = true;
  }

  confirmRestore(): void {
    const customer = this.pendingRestore;
    if (!customer) return;
    this.actionLoading = true;
    this.customersService.restoreCustomer(customer.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cliente restaurado correctamente',
        });
        this.closeRestore();
        this.loadCustomers();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo restaurar el cliente',
        });
        this.actionLoading = false;
      },
    });
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.pendingDelete = null;
    this.actionLoading = false;
  }

  closeRestore(): void {
    this.showRestoreModal = false;
    this.pendingRestore = null;
    this.actionLoading = false;
  }

  private applySearch(): void {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      this.filteredCustomers = [...this.allCustomers];
      return;
    }
    this.filteredCustomers = this.allCustomers.filter((c) =>
      [c.name, c.nit, c.phone, c.email, c.contactName, c.category?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }
}
