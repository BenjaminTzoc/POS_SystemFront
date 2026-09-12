import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'deliveryDate',
  standalone: true
})
export class DeliveryDatePipe implements PipeTransform {
  private readonly months = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];

  transform(value: Date | string | null | undefined): string {
    if (!value) return 'Sin fecha';

    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Sin fecha';

    const now = new Date();
    const isToday = 
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (isToday) {
      return `Hoy, ${timeStr}`;
    }

    const day = date.getDate();
    const month = this.months[date.getMonth()];
    return `${day} ${month} · ${timeStr}`;
  }
}
