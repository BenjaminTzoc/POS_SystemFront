import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'transferStatus',
  standalone: true,
})
export class TransferStatusPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return 'N/A';

    const statuses: { [key: string]: string } = {
      PENDING: 'Pendiente',
      SHIPPED: 'En Tránsito',
      RECEIVED: 'Recibido',
      CANCELLED: 'Cancelado',
    };

    return statuses[value] || value;
  }
}
