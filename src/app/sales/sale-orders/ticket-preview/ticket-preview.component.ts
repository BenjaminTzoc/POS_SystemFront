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

  async onSendEmail() {
    if (this.isSendingEmail()) return;

    try {
      this.isSendingEmail.set(true);
      // We assume the backend has an endpoint for this.
      // Based on instructions, we specify if we need something from backend.
      // I'll emit a call to a hypothetical method in OrdersService.

      // I'll check if the customer has an email
      const email = this.sale.customer?.email;
      if (!email) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sin Email',
          detail: 'El cliente no tiene un correo electrónico registrado.',
        });
        return;
      }

      // Prototyping backend call (I'll need to add this method to OrdersService)
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
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Fallo al enviar el correo. Verifique configuración de servidor.',
          });
          this.isSendingEmail.set(false);
        },
      });
    } catch (error) {
      this.isSendingEmail.set(false);
    }
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
