import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'discountType',
})
export class DiscountTypePipe implements PipeTransform {
  transform(status: string): string {
    const statusMap: { [key: string]: string } = {
      percentage: 'Porcentaje',
      amount: 'Monto',
    };

    return statusMap[status] || status;
  }
}
