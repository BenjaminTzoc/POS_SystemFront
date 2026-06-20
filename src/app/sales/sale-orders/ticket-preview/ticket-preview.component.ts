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

  isGenerating = signal(false);
  isSendingEmail = signal(false);
  isSendingWhatsApp = signal(false);

  async onPrint() {
    try {
      this.isGenerating.set(true);
      const blob = await this.printService.generatePDF('pos-ticket');
      this.printService.printPDF(blob);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el documento para impresión',
      });
    } finally {
      this.isGenerating.set(false);
    }
  }

  async onDownload() {
    try {
      this.isGenerating.set(true);
      const blob = await this.printService.generatePDF('pos-ticket');
      this.printService.downloadPDF(blob, `ticket-${this.sale.invoiceNumber}`);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo descargar el PDF',
      });
    } finally {
      this.isGenerating.set(false);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async onSendEmail() {
    if (this.isSendingEmail()) return;

    try {
      // Check if the customer has an email
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

      // Generate the exact same PDF as used for printing/downloading
      const blob = await this.printService.generatePDF('pos-ticket');
      const base64 = await this.blobToBase64(blob);

      this.ordersService.sendTicketByEmail(this.sale.id, base64).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Enviado',
            detail: 'Ticket enviado exitosamente por correo.',
          });
          this.isSendingEmail.set(false);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Fallo al enviar el correo. Verifique configuración de servidor.',
          });
          this.isSendingEmail.set(false);
        },
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el documento PDF para el envío por correo.',
      });
      this.isSendingEmail.set(false);
    }
  }

  async onSendWhatsApp() {
    if (this.isSendingWhatsApp()) return;

    try {
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

      const blob = await this.printService.generatePDF('pos-ticket');
      const base64 = await this.blobToBase64(blob);

      this.ordersService.sendTicketByWhatsApp(this.sale.id, base64).subscribe({
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
    } catch (error) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo generar el documento PDF para el envío por WhatsApp.',
      });
      this.isSendingWhatsApp.set(false);
    }
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
