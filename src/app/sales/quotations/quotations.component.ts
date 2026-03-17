import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

import { QuotationsService } from '../services/quotations.service';
import { IQuotation, QuotationStatus, IQuotationResponse } from '../interfaces/quotation.interface';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialog,
    FormsModule,
    InputTextModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './quotations.component.html',
  styleUrl: './quotations.component.css',
})
export class QuotationsComponent implements OnInit {
  private quotationsService = inject(QuotationsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  quotations: IQuotation[] = [];
  loading = false;
  searchTerm = '';

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.loading = true;
    this.quotationsService.getQuotations({ search: this.searchTerm }).subscribe({
      next: (res: IQuotationResponse) => {
        this.quotations = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las cotizaciones.',
        });
      },
    });
  }

  goToNewQuotation(): void {
    this.router.navigate(['/sales/new-quotation']);
  }

  confirmConvert(quotation: IQuotation): void {
    this.confirmationService.confirm({
      header: 'Convertir a Venta',
      message: `¿Estás seguro de que deseas convertir la cotización ${quotation.quotationNumber} en una Órden de Venta? El stock se descontará en este momento.`,
      icon: 'pi pi-shopping-cart',
      acceptLabel: 'Sí, convertir',
      acceptButtonStyleClass: 'p-button-success',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.convertToSale(quotation.id);
      },
    });
  }

  private convertToSale(id: string): void {
    this.quotationsService.convertToSale(id).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Convertido',
          detail: 'Cotización convertida a venta exitosamente.',
        });
        // Redirect to the sale orders list
        this.router.navigate(['/sales/orders']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo realizar la conversión: ${err.error.message}`,
        });
      },
    });
  }

  confirmCancel(quotation: IQuotation): void {
    this.confirmationService.confirm({
      header: 'Anular Cotización',
      message: `¿Deseas anular la cotización ${quotation.quotationNumber}? Esta acción no se puede deshacer.`,
      icon: 'pi pi-times-circle',
      acceptLabel: 'Sí, anular',
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: 'Cerrar',
      rejectButtonStyleClass: 'p-button-text p-button-secondary',
      accept: () => {
        this.updateStatus(quotation.id, 'CANCELLED');
      },
    });
  }

  private updateStatus(id: string, status: QuotationStatus): void {
    this.quotationsService.updateStatus(id, status).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Actualizado',
          detail: 'El estado ha sido modificado.',
        });
        this.loadQuotations();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al actualizar: ${err.error.message}`,
        });
      },
    });
  }

  getSeverity(
    status: QuotationStatus,
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'PENDING':
        return 'info';
      case 'CONVERTED':
        return 'success';
      case 'EXPIRED':
        return 'warn';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getStatusLabel(status: QuotationStatus): string {
    const labels: { [key: string]: string } = {
      PENDING: 'Pendiente',
      CONVERTED: 'Convertida',
      EXPIRED: 'Expirada',
      CANCELLED: 'Anulada',
    };
    return labels[status] || status;
  }

  getIcon(status: QuotationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'pi pi-clock';
      case 'CONVERTED':
        return 'pi pi-check-circle';
      case 'EXPIRED':
        return 'pi pi-exclamation-circle';
      case 'CANCELLED':
        return 'pi pi-times-circle';
      default:
        return 'pi pi-info-circle';
    }
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
