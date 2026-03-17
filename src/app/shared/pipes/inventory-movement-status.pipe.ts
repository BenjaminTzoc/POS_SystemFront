import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementStatus',
})
export class InventoryMovementStatusPipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Pendiente',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    };

    return statusMap[status.toUpperCase()] || status;
  }
}
