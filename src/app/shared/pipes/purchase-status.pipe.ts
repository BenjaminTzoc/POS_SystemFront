import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'purchaseStatus',
})
export class PurchaseStatusPipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      partially_paid: 'Parcialmente pagado',
      paid: 'Pagado',
      cancelled: 'Cancelado',
      received: 'Recibido',
    };

    return statusMap[status] || status;
  }
}
