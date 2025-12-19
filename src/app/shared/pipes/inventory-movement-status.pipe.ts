import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementStatus',
})
export class InventoryMovementStatusPipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };

    return statusMap[status] || status;
  }
}
