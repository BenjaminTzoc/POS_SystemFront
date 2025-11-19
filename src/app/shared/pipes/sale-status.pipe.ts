import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: 'saleStatus'
})
export class SaleStatusPipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'preparing': 'En Preparación',

      'ready_for_pickup': 'Listo para recoger',
      'out_for_delivery': 'En camino',
      'delivered': 'Entregado',

      'partially_delivered': 'Parcialmente entregado',
      'cancelled': 'Cancelado',
      'on_hold': 'En espera'
    };

    return statusMap[status] || status;
  }
}