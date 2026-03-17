import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementType',
})
export class InventoryMovementTypePipe implements PipeTransform {
  transform(type: string): string {
    const typeMap: { [key: string]: string } = {
      IN: 'Entrada',
      OUT: 'Salida',
      ADJUSTMENT: 'Ajuste',
      TRANSFER_IN: 'Entrada por traslado',
      TRANSFER_OUT: 'Salida por traslado',
    };

    return typeMap[type.toUpperCase()] || type;
  }
}
