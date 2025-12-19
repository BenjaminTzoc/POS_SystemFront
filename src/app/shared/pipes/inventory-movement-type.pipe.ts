import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementType',
})
export class InventoryMovementTypePipe implements PipeTransform {
  transform(type: string): string {
    const typeMap: { [key: string]: string } = {
      in: 'Entrada',
      out: 'Salida',
      adjustment: 'Ajuste',
    };

    return typeMap[type] || type;
  }
}
