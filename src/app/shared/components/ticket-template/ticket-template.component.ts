import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ISaleOrderResponse } from '../../../sales/interfaces/sale-order.interface';

@Component({
  selector: 'app-ticket-template',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './ticket-template.component.html',
  styleUrl: './ticket-template.component.css',
})
export class TicketTemplateComponent {
  @Input() sale!: ISaleOrderResponse;
  @Input() companyInfo = {
    name: 'SISTEMA POS',
    address: 'Calle Ficticia 123, Ciudad',
    phone: '2222-3333',
    email: 'contacto@pos.com',
    nit: '1234567-8',
    logo: 'assets/layout/images/logo-dark.svg', // Using an existing logo if possible
  };

  get today() {
    return new Date();
  }
}
