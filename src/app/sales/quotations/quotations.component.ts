import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';
import { LucideCirclePlus, LucideRefreshCw, LucideEye, LucideSquarePen, LucideBan, LucideShoppingCart, LucideFileText } from '@lucide/angular';

import { QuotationsService } from '../services/quotations.service';
import { IQuotation, QuotationStatus, IQuotationResponse } from '../interfaces/quotation.interface';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';

import { QuotationPreviewComponent } from './quotation-preview/quotation-preview.component';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { StandardTableComponent } from '../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-quotations',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    ConfirmDialog,
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    SelectModule,
    RippleModule,
    LucideCirclePlus,
    LucideSquarePen,
    LucideBan,
    LucideShoppingCart,
    QuotationPreviewComponent,
    ConfirmationModalComponent,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    StandardTableComponent,
    StatusBadgeComponent,
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
  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);

  quotations: IQuotation[] = [];
  branches = signal<Branch[]>([]);
  loading = false;
  searchTerm = '';
  selectedBranch: string | null = null;
  selectedStatus: QuotationStatus | null = null;
  
  statusOptions = [
    { label: 'Pendiente', value: 'PENDING' },
    { label: 'Convertida', value: 'CONVERTED' },
    { label: 'Expirada', value: 'EXPIRED' },
    { label: 'Cancelada', value: 'CANCELLED' }
  ];

  isSuperAdmin = computed(() => {
    return this.authService.currentUser?.roles?.some(r => r.isSuperAdmin) ?? false;
  });

  expandedRows = signal<any>({});
  displayDetails = false;
  selectedQuotation: IQuotation | null = null;

  showConvertConfirmDialog = false;
  quotationToConvert: IQuotation | null = null;
  isConverting = false;

  showCancelConfirmDialog = false;
  quotationToCancel: IQuotation | null = null;

  ngOnInit(): void {
    this.loadBranches();
    this.loadQuotations();
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
        }
      }
    });
  }

  loadQuotations(): void {
    this.loading = true;
    const filters: any = {};
    if (this.searchTerm?.trim()) filters.search = this.searchTerm.trim();
    if (this.selectedBranch) filters.branchId = this.selectedBranch;
    if (this.selectedStatus) filters.status = this.selectedStatus;

    this.quotationsService.getQuotations(filters).subscribe({
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

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = null;
    this.selectedBranch = null;
    this.loadQuotations();
  }

  toggleRowExpansion(quotation: IQuotation, tableRef: any, event?: Event): void {
    if (tableRef) {
      tableRef.toggleRow(quotation, event);
    }
  }

  goToNewQuotation(): void {
    this.router.navigate(['/sales/new-quotation']);
  }

  onEditQuotation(id: string): void {
    this.router.navigate(['/sales/edit-quotation', id]);
  }

  showDetails(quotation: IQuotation): void {
    this.selectedQuotation = quotation;
    this.displayDetails = true;
  }

  confirmConvert(quotation: IQuotation): void {
    this.quotationToConvert = quotation;
    this.showConvertConfirmDialog = true;
  }

  executeConvertToSale(): void {
    if (!this.quotationToConvert) return;
    this.isConverting = true;
    this.quotationsService.convertToSale(this.quotationToConvert.id).subscribe({
      next: (res) => {
        this.isConverting = false;
        this.showConvertConfirmDialog = false;
        const saleId = res.data?.saleId;
        this.messageService.add({
          severity: 'success',
          summary: 'Convertido',
          detail: 'Cotización convertida a orden. Si es un pedido a futuro, márcala como preorden en la venta.',
        });
        if (saleId) {
          this.router.navigate(['/sales/new-order'], { queryParams: { id: saleId } });
        } else {
          this.router.navigate(['/sales/orders']);
        }
      },
      error: (err) => {
        this.isConverting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo realizar la conversión: ${err.error?.message || 'Error del servidor'}`,
        });
      },
    });
  }

  downloadPdf(quotation: IQuotation): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Generando Documento',
      detail: `Preparando PDF de ${quotation.correlative}...`,
      life: 2000
    });

    this.quotationsService.downloadPdf(quotation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cotizacion_${quotation.correlative}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Descargado',
          detail: `Documento ${quotation.correlative} descargado correctamente.`,
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el documento PDF.',
        });
      },
    });
  }

  sendEmail(quotation: IQuotation): void {
    const email = quotation.customer?.email || quotation.guestCustomer?.email;
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'El cliente no tiene un correo electrónico registrado.',
      });
      return;
    }

    this.quotationsService.sendQuotationByEmail(quotation.id, email).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: `Cotización enviada a ${email} correctamente.`,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo enviar el correo.',
        });
      },
    });
  }

  confirmCancel(quotation: IQuotation): void {
    this.quotationToCancel = quotation;
    this.showCancelConfirmDialog = true;
  }

  executeCancelQuotation(): void {
    if (!this.quotationToCancel) return;
    const id = this.quotationToCancel.id;
    this.showCancelConfirmDialog = false;
    this.updateStatus(id, 'CANCELLED');
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
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | string {
    switch (status) {
      case 'PENDING':
        return 'warn';
      case 'CONVERTED':
        return 'success';
      case 'EXPIRED':
        return 'danger';
      case 'CANCELLED':
        return 'secondary';
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

  getValidityInfo(validUntil: string | Date | undefined): { text: string; isExpired: boolean } {
    if (!validUntil) return { text: 'Sin vigencia', isExpired: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(validUntil);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const days = Math.abs(diffDays);
      return { text: `Vencida hace ${days} ${days === 1 ? 'día' : 'días'}`, isExpired: true };
    } else if (diffDays === 0) {
      return { text: 'Vence hoy', isExpired: false };
    } else {
      return { text: `Vence en ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`, isExpired: false };
    }
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

  getGroupedDetails(quotation: IQuotation) {
    if (!quotation || !quotation.items) return [];

    const groups: {
      productId: string;
      productName: string;
      sku: string;
      unitAbbreviation: string;
      unitPrice: number;
      productImage?: string;
      items: any[];
      totalQuantity: number;
      totalAmount: number;
    }[] = [];

    quotation.items.forEach((item: any) => {
      const prodId = item.productId || item.product?.id || item.productName || '';
      let group = groups.find((g) => g.productId === prodId);
      if (!group) {
        group = {
          productId: prodId,
          productName: item.productName || item.product?.name || 'Producto',
          sku: item.productSku || item.product?.sku || '---',
          unitAbbreviation: item.product?.unit?.abbreviation || 'U',
          unitPrice: Number(item.unitPrice || 0),
          productImage: item.productImage || item.product?.imageUrl,
          items: [],
          totalQuantity: 0,
          totalAmount: 0,
        };
        groups.push(group);
      }
      group.items.push(item);
      group.totalQuantity += Number(item.quantity || 0);
      group.totalAmount += Number(item.lineTotal || item.subtotal || 0);
    });

    return groups.sort((a, b) =>
      a.productName.localeCompare(b.productName, 'es', { sensitivity: 'base' })
    );
  }
}
