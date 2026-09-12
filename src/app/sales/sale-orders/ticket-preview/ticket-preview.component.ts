// Ticket preview component for POS
import { Component, Input, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ISaleOrderResponse } from '../../interfaces/sale-order.interface';
import { TicketTemplateComponent } from '../../../shared/components/ticket-template/ticket-template.component';
import { PrintService } from '../../../shared/services/print.service';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-ticket-preview',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TicketTemplateComponent],
  templateUrl: './ticket-preview.component.html',
  styleUrl: './ticket-preview.component.css',
})
export class TicketPreviewComponent {
  private printService = inject(PrintService);
  private ordersService = inject(OrdersService);
  private messageService = inject(MessageService);

  @Input() sale!: ISaleOrderResponse;
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  isPrinting = signal(false);
  isDownloading = signal(false);
  isSendingEmail = signal(false);
  isSendingWhatsApp = signal(false);

  onPrint() {
    if (this.isPrinting()) return;
    this.isPrinting.set(true);

    this.ordersService.getSalePdf(this.sale.id).subscribe({
      next: (blob) => {
        this.printService.printPDF(blob);
        this.isPrinting.set(false);
      },
      error: (error) => {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el documento para impresión',
        });
        this.isPrinting.set(false);
      },
    });
  }

  onDownload() {
    if (this.isDownloading()) return;
    this.isDownloading.set(true);

    this.ordersService.getSalePdf(this.sale.id).subscribe({
      next: (blob) => {
        const filename = `Factura_${this.sale.invoiceNumber || this.sale.id}.pdf`;
        this.printService.downloadPDF(blob, filename);
        this.isDownloading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo descargar el PDF de la factura',
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
