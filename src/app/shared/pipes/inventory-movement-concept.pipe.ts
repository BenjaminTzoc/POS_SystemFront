import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementConcept',
})
export class InventoryMovementConceptPipe implements PipeTransform {
  transform(concept: string): string {
    const conceptMap: { [key: string]: string } = {
      sale: 'Venta',
      purchase: 'Compra',
      transfer: 'Transferencia',
      adjustment: 'Ajuste',
      waste: 'Merma/Desecho',
      return: 'Devolución',
    };

    return conceptMap[concept] || concept;
  }
}
