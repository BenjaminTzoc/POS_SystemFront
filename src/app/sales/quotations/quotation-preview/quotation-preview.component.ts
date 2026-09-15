import { Component, Input, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { IQuotation } from '../../interfaces/quotation.interface';
import { QuotationsService } from '../../services/quotations.service';
import { PrintService } from '../../../shared/services/print.service';
import { CompanySettingService } from '../../../shared/services/company-setting.service';

@Component({
  selector: 'app-quotation-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TooltipModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './quotation-preview.component.html',
  styleUrl: './quotation-preview.component.css',
})
export class QuotationPreviewComponent implements OnInit {
  private quotationsService = inject(QuotationsService);
  private printService = inject(PrintService);
  private companySettingService = inject(CompanySettingService);
  private messageService = inject(MessageService);

  @Input() quotation: IQuotation | null | undefined = null;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  isPrinting = signal(false);
  isDownloading = signal(false);
  isSendingEmail = signal(false);
  isSendingWhatsApp = signal(false);

  companyInfo = {
    name: 'SISTEMA POS',
    address: 'Calle Ficticia 123, Ciudad',
    phone: '2222-3333',
    email: 'contacto@pos.com',
    nit: '1234567-8',
    logo: 'logo.png',
  };

  ngOnInit() {
    this.companySettingService.getSettings().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.companyInfo.address = res.data.address || this.companyInfo.address;
          this.companyInfo.phone = res.data.phone || this.companyInfo.phone;
          this.companyInfo.nit = res.data.nit || this.companyInfo.nit;
          this.companyInfo.name = res.data.companyName || this.companyInfo.name;
          if (res.data.logoUrl) {
            this.companyInfo.logo = res.data.logoUrl;
          }
        }
      },
    });
  }

  getStatusLabel(status?: string): string {
    if (!status) return '';
    const map: Record<string, string> = {
      PENDING: 'Pendiente',
      CONVERTED: 'Confirmado',
      EXPIRED: 'Expirado',
      CANCELLED: 'Anulado',
    };
    return map[status] || status;
  }

  get validityDays(): number {
    if (!this.quotation?.validUntil) return 0;
    const created = this.quotation.createdAt ? new Date(this.quotation.createdAt) : new Date();
    const valid = new Date(this.quotation.validUntil);
    const diffTime = valid.getTime() - created.getTime();
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  }

  get validityExpireDateFormatted(): string {
    if (!this.quotation?.validUntil) return '';
    const valid = new Date(this.quotation.validUntil);
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const day = valid.getDate();
    const month = months[valid.getMonth()];
    const year = valid.getFullYear();
    return `${day} de ${month} de ${year}`;
  }

  getValidityFormatted(): string {
    if (!this.quotation?.validUntil) return 'Sin vigencia';
    return `${this.validityDays} ${this.validityDays === 1 ? 'día' : 'días'} (Vence: ${this.validityExpireDateFormatted})`;
  }

  get totalDiscount(): number {
    if (!this.quotation) return 0;
    if (this.quotation.discountAmount !== undefined && Number(this.quotation.discountAmount) > 0) {
      return Number(this.quotation.discountAmount);
    }
    if (!this.quotation.items) return 0;
    let total = 0;
    for (const item of this.quotation.items) {
      if (item.discountAmount) {
        total += Number(item.discountAmount);
      } else if (item.discount && item.discount > 0) {
        total += Number(item.discount);
      }
    }
    return total;
  }

  get taxAmount(): number {
    if (!this.quotation) return 0;
    return Number(this.quotation.taxAmount ?? this.quotation.tax ?? 0);
  }

  get groupedDetails() {
    if (!this.quotation || !this.quotation.items) return [];

    const groups: {
      productId: string;
      productName: string;
      sku: string;
      unitAbbreviation: string;
      unitPrice: number;
      items: any[];
      totalQuantity: number;
      totalAmount: number;
    }[] = [];

    this.quotation.items.forEach((item: any) => {
      const prodId = item.productId || item.product?.id || item.productName || '';
      let group = groups.find((g) => g.productId === prodId);
      if (!group) {
        group = {
          productId: prodId,
          productName: item.productName || item.product?.name || 'Producto',
          sku: item.productSku || item.product?.sku || '---',
          unitAbbreviation: item.product?.unit?.abbreviation || '',
          unitPrice: Number(item.unitPrice || 0),
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

  async onPrint() {
    if (this.isPrinting() || !this.quotation) return;
    const currentQuotation = this.quotation;
    this.isPrinting.set(true);

    this.quotationsService.downloadPdf(currentQuotation.id).subscribe({
      next: (blob) => {
        this.printService.printPDF(blob);
        this.isPrinting.set(false);
      },
      error: async (error) => {
        console.warn('Backend PDF endpoint error, using client-side generator...', error);
        try {
          const blob = await this.printService.generatePDF('pos-ticket', 'letter');
          this.printService.printPDF(blob);
        } catch (e) {
          console.error('Failed to generate print PDF:', e);
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Impresión',
            detail: 'No se pudo generar el documento para impresión.',
          });
        }
        this.isPrinting.set(false);
      },
    });
  }

  async onDownload() {
    if (this.isDownloading() || !this.quotation) return;
    const currentQuotation = this.quotation;
    this.isDownloading.set(true);

    this.quotationsService.downloadPdf(currentQuotation.id).subscribe({
      next: (blob) => {
        const filename = `Cotizacion_${currentQuotation.correlative || currentQuotation.id}.pdf`;
        this.printService.downloadPDF(blob, filename);
        this.messageService.add({
          severity: 'success',
          summary: 'Descarga Completa',
          detail: `Cotización ${currentQuotation.correlative || ''} descargada con éxito.`,
        });
        this.isDownloading.set(false);
      },
      error: async (error) => {
        console.warn('Backend download PDF error, generating client-side PDF...', error);
        try {
          const blob = await this.printService.generatePDF('pos-ticket', 'letter');
          const filename = `Cotizacion_${currentQuotation.correlative || currentQuotation.id}.pdf`;
          this.printService.downloadPDF(blob, filename);
          this.messageService.add({
            severity: 'success',
            summary: 'Descarga Completa',
            detail: `Cotización ${currentQuotation.correlative || ''} descargada con éxito.`,
          });
        } catch (e) {
          console.error('Failed to download PDF:', e);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo descargar el PDF de la cotización.',
          });
        }
        this.isDownloading.set(false);
      },
    });
  }

  onSendEmail() {
    if (this.isSendingEmail() || !this.quotation) return;

    const email = this.quotation.customer?.email || this.quotation.guestCustomer?.email;
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Email',
        detail: 'El cliente no tiene un correo electrónico registrado.',
      });
      return;
    }

    this.isSendingEmail.set(true);

    this.quotationsService.sendQuotationByEmail(this.quotation.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Cotización enviada exitosamente por correo.',
        });
        this.isSendingEmail.set(false);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Fallo al enviar el correo. Verifique configuración de servidor.',
        });
        this.isSendingEmail.set(false);
      },
    });
  }

  onSendWhatsApp() {
    if (this.isSendingWhatsApp() || !this.quotation) return;

    const phone = this.quotation.customer?.phone || this.quotation.guestCustomer?.phone;
    if (!phone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Teléfono',
        detail: 'El cliente no tiene un número de teléfono registrado.',
      });
      return;
    }

    this.isSendingWhatsApp.set(true);

    this.quotationsService.sendQuotationByWhatsApp(this.quotation.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Cotización enviada exitosamente por WhatsApp.',
        });
        this.isSendingWhatsApp.set(false);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Fallo al enviar el mensaje de WhatsApp. Verifique la configuración.',
        });
        this.isSendingWhatsApp.set(false);
      },
    });
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
