import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ISaleOrderResponse } from '../../../sales/interfaces/sale-order.interface';
import { SaleStatusPipe } from '../../pipes/sale-status.pipe';
import { CompanySettingService } from '../../services/company-setting.service';

@Component({
  selector: 'app-ticket-template',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, SaleStatusPipe],
  templateUrl: './ticket-template.component.html',
  styleUrl: './ticket-template.component.css',
})
export class TicketTemplateComponent implements OnInit {
  private companySettingService = inject(CompanySettingService);

  @Input() sale!: ISaleOrderResponse;
  @Input() companyInfo = {
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
          this.companyInfo.address = res.data.address;
          this.companyInfo.phone = res.data.phone;
          this.companyInfo.nit = res.data.nit;
          this.companyInfo.name = res.data.companyName;
        }
      }
    });
  }

  get today() {
    return new Date();
  }

  get groupedDetails() {
    if (!this.sale || !this.sale.details) return [];
    
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

    this.sale.details.forEach(item => {
      const prodId = item.product?.id || '';
      let group = groups.find(g => g.productId === prodId);
      if (!group) {
        group = {
          productId: prodId,
          productName: item.product?.name || 'Producto',
          sku: item.product?.sku || '',
          unitAbbreviation: item.product?.unit?.abbreviation || '',
          unitPrice: Number(item.unitPrice || 0),
          items: [],
          totalQuantity: 0,
          totalAmount: 0
        };
        groups.push(group);
      }
      group.items.push(item);
      group.totalQuantity += Number(item.quantity || 0);
      group.totalAmount += Number(item.lineTotal || 0);
    });

    return groups.sort((a, b) => a.productName.localeCompare(b.productName, 'es', { sensitivity: 'base' }));
  }
}
