import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse } from '../../interfaces/sale-order.interface';
import { ISaleReceiptsData, IReceiptPaymentItem } from '../../interfaces/sale-payment.interface';
import { TicketTemplateComponent } from '../../../shared/components/ticket-template/ticket-template.component';
import { SaleStatusPipe } from '../../../shared/pipes/sale-status.pipe';
import { PrintService } from '../../../shared/services/print.service';
import { OrdersService } from '../../services/orders.service';
import { SalePaymentsService } from '../../services/sale-payments.service';
import { CompanySettingService } from '../../../shared/services/company-setting.service';

@Component({
  selector: 'app-ticket-preview',
  standalone: true,
  imports: [
    CommonModule, 
    CurrencyPipe, 
    DatePipe, 
    ButtonModule, 
    DialogModule, 
    TooltipModule,
    TicketTemplateComponent,
    SaleStatusPipe
  ],
  templateUrl: './ticket-preview.component.html',
  styleUrl: './ticket-preview.component.css',
})
export class TicketPreviewComponent implements OnInit, OnChanges {
  private printService = inject(PrintService);
  private ordersService = inject(OrdersService);
  private salePaymentsService = inject(SalePaymentsService);
  private companySettingService = inject(CompanySettingService);
  private messageService = inject(MessageService);

  @Input() sale!: ISaleOrderResponse;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  companyInfo = {
    name: 'SISTEMA POS',
    address: 'Calle Ficticia 123, Ciudad',
    phone: '2222-3333',
    email: 'contacto@pos.com',
    nit: '1234567-8',
    logo: 'logo.png',
  };

  activeTab: 'invoice' | 'receipts' = 'invoice';
  receiptsData = signal<ISaleReceiptsData | null>(null);
  loadingReceipts = signal<boolean>(false);
  selectedReceipt = signal<IReceiptPaymentItem | null>(null);

  sortedPayments = computed<IReceiptPaymentItem[]>(() => {
    const data = this.receiptsData();
    if (!data || !data.payments) return [];
    return [...data.payments].reverse();
  });

  getPaymentNumber(payment: IReceiptPaymentItem): number {
    const payments = this.receiptsData()?.payments;
    if (!payments) return 1;
    const idx = payments.findIndex(p => p.id === payment.id);
    return idx !== -1 ? idx + 1 : 1;
  }

  isPrinting = signal(false);
  isDownloading = signal(false);
  isSendingEmail = signal(false);
  isSendingWhatsApp = signal(false);

  ngOnInit(): void {
    this.companySettingService.getSettings().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.companyInfo.address = res.data.address;
          this.companyInfo.phone = res.data.phone;
          this.companyInfo.nit = res.data.nit;
          this.companyInfo.name = res.data.companyName;
          if (res.data.logoUrl) {
            this.companyInfo.logo = res.data.logoUrl;
          }
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.sale) {
      this.activeTab = 'invoice';
      this.selectedReceipt.set(null);
      this.loadReceipts();
    }
  }

  loadReceipts(): void {
    if (!this.sale?.id) return;
    this.loadingReceipts.set(true);
    this.salePaymentsService.getSaleReceipts(this.sale.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.receiptsData.set(res.data);
        }
        this.loadingReceipts.set(false);
      },
      error: () => {
        this.loadingReceipts.set(false);
      }
    });
  }

  selectReceipt(payment: IReceiptPaymentItem): void {
    this.selectedReceipt.set(payment);
  }

  clearSelectedReceipt(): void {
    this.selectedReceipt.set(null);
  }

  printReceipt(): void {
    window.print();
  }

  onPrint() {
    if (this.isPrinting()) return;
    this.isPrinting.set(true);

    const request$ =
      this.activeTab === 'receipts'
        ? this.salePaymentsService.getSaleReceiptPdf(this.sale.id)
        : this.ordersService.getSalePdf(this.sale.id);

    request$.subscribe({
      next: (blob) => {
        this.printService.printPDF(blob);
        this.isPrinting.set(false);
      },
      error: (error) => {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            this.activeTab === 'receipts'
              ? 'No se pudo generar el recibo de abonos para impresión'
              : 'No se pudo generar el documento para impresión',
        });
        this.isPrinting.set(false);
      },
    });
  }

  onDownload() {
    if (this.isDownloading()) return;
    this.isDownloading.set(true);

    const invoiceNumber = this.sale.invoiceNumber || this.sale.id;
    const isReceipts = this.activeTab === 'receipts';
    const request$ = isReceipts
      ? this.salePaymentsService.getSaleReceiptPdf(this.sale.id)
      : this.ordersService.getSalePdf(this.sale.id);

    request$.subscribe({
      next: (blob) => {
        const filename = isReceipts
          ? `Recibo_Abonos_${invoiceNumber}`
          : `Factura_${invoiceNumber}.pdf`;
        this.printService.downloadPDF(blob, filename);
        this.isDownloading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: isReceipts
            ? 'No se pudo descargar el PDF del recibo de abonos'
            : 'No se pudo descargar el PDF de la factura',
        });
        this.isDownloading.set(false);
      },
    });
  }

  onSendEmail() {
    if (this.isSendingEmail()) return;

    const email = this.sale.customer?.email || this.sale.guestCustomer?.email;
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Email',
        detail: 'El cliente no tiene un correo electrónico registrado.',
      });
      return;
    }

    this.isSendingEmail.set(true);

    this.ordersService.sendTicketByEmail(this.sale.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Ticket enviado exitosamente por correo.',
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
    if (this.isSendingWhatsApp()) return;

    const phone = this.sale.customer?.phone || this.sale.guestCustomer?.phone;
    if (!phone) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Teléfono',
        detail: 'El cliente no tiene un número de teléfono registrado.',
      });
      return;
    }

    this.isSendingWhatsApp.set(true);

    this.ordersService.sendTicketByWhatsApp(this.sale.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Ticket enviado exitosamente por WhatsApp.',
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
