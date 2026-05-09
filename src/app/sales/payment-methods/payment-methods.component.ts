import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Services
import { PaymentMethodsService } from '../services/payment-methods.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ToggleSwitchModule
  ],
  templateUrl: './payment-methods.component.html',
})
export class PaymentMethodsComponent implements OnInit {
  private paymentService = inject(PaymentMethodsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private authService = inject(AuthService);

  paymentMethods = signal<any[]>([]);
  loading = signal(false);
  showDeleted = false;

  get canViewDeleted(): boolean {
    return this.authService.currentUser?.roles?.some(r => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.loading.set(true);
    this.paymentService.getPaymentMethods(this.showDeleted).subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los métodos de pago' });
        this.loading.set(false);
      }
    });
  }

  isDeleted(method: any): boolean {
    return !!method.deletedAt;
  }

  goToNewMethod(): void {
    this.router.navigate(['/sales/payment-methods/new']);
  }

  onEditMethod(id: string): void {
    this.router.navigate(['/sales/payment-methods/edit', id]);
  }



  onDeleteMethod(method: any): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el método de pago: ${method.name}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-xl',
      accept: () => {
        this.paymentService.deletePaymentMethod(method.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago eliminado' });
            this.loadPaymentMethods();
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar el método de pago' });
          }
        });
      }
    });
  }

  restoreMethod(method: any): void {
    this.paymentService.restorePaymentMethod(method.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago restaurado' });
        this.loadPaymentMethods();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo restaurar el método de pago' });
      }
    });
  }
}
