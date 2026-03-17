import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inventoryMovementConcept',
})
export class InventoryMovementConceptPipe implements PipeTransform {
  transform(concept: string): string {
    const conceptMap: { [key: string]: string } = {
      SALE: 'Venta',
      PURCHASE: 'Compra',
      TRANSFER: 'Traslado',
      ADJUSTMENT: 'Ajuste',
      WASTE: 'Merma',
      INITIAL_STOCK: 'Stock Inicial',
      RETURN: 'Devolución',
    };

    return conceptMap[concept.toUpperCase()] || concept;
  }
}
