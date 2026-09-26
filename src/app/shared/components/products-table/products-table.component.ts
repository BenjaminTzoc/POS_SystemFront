import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

export interface QuotationItem {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  discount: number;
  discountType?: 'percentage' | 'fixed_amount';
  maxStock: number;
  unitName?: string;
  unitAbbreviation?: string;
  allowsDecimals?: boolean;
  isAvailable?: boolean;
  isUnlimited?: boolean;
  /** Precio de lista del catálogo (si el actual es pactado). */
  listPrice?: number;
  /** True cuando el unitario proviene de un precio pactado con el cliente. */
  isCustomPrice?: boolean;
}

@Component({
  selector: 'app-products-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    ButtonModule,
    TooltipModule,
    InputNumberModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  templateUrl: './products-table.component.html',
})
export class ProductsTableComponent {
  /** Lista de ítems en la tabla */
  @Input() items: QuotationItem[] = [];

  /** Título de la tabla */
  @Input() title = 'Ítems de la Cotización';

  /** Mensaje de lista vacía */
  @Input() emptyTitle = 'Ningún producto agregado a la cotización';
  @Input() emptySubtitle = 'Haz clic en una tarjeta del catálogo superior para agregar productos al detalle de la cotización.';

  /** Mostrar columna de precio editable (por defecto: true) */
  @Input() showPrice = true;

  /** Mostrar columna de descuento editable (por defecto: true) */
  @Input() showDiscount = true;

  /** Mostrar footer de resumen de totales al pie de la tabla (por defecto: true) */
  @Input() showTotals = true;

  /** Deshabilita edición, limpieza y eliminación */
  @Input() disabled = false;

  /** Evento emitido al eliminar un ítem por índice */
  @Output() itemRemove = new EventEmitter<number>();

  /** Evento emitido al limpiar toda la lista */
  @Output() clearAll = new EventEmitter<void>();

  /** Evento emitido cuando cambia cantidad, precio o descuento de un ítem */
  @Output() itemChange = new EventEmitter<{ index: number; item: QuotationItem }>();

  getItemDiscountAmount(item: QuotationItem): number {
    const gross = (item.quantity || 0) * (item.price || 0);
    const disc = item.discount || 0;
    if (item.discountType === 'percentage') {
      return (gross * disc) / 100;
    }
    return disc;
  }

  getItemSubtotal(item: QuotationItem): number {
    const gross = (item.quantity || 0) * (item.price || 0);
    const discAmount = this.getItemDiscountAmount(item);
    return Math.max(0, gross - discAmount);
  }

  toggleDiscountType(item: QuotationItem, index: number): void {
    if (this.disabled) return;
    item.discountType = item.discountType === 'percentage' ? 'fixed_amount' : 'percentage';
    if (item.discountType === 'percentage' && item.discount > 100) {
      item.discount = 100;
    }
    this.emitItemChange(index, item);
  }

  emitItemChange(index: number, item: QuotationItem): void {
    this.itemChange.emit({ index, item });
  }

  get totalUnitsCount(): number {
    return this.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
  }

  get totalDiscount(): number {
    return this.items.reduce((acc, i) => acc + this.getItemDiscountAmount(i), 0);
  }

  get totalEstimatedValue(): number {
    return this.items.reduce((acc, i) => acc + this.getItemSubtotal(i), 0);
  }

  get customPriceCount(): number {
    return this.items.filter((i) => i.isCustomPrice).length;
  }

  customPriceTooltip(item: QuotationItem): string {
    const list = Number(item.listPrice);
    if (!Number.isFinite(list) || list <= 0) {
      return 'Precio pactado con este cliente';
    }
    return `Precio pactado con este cliente. Precio original: Q ${list.toFixed(2)}`;
  }

  showListStrike(item: QuotationItem): boolean {
    if (!item.isCustomPrice || item.listPrice == null) return false;
    return Math.abs(Number(item.listPrice) - Number(item.price)) > 0.009;
  }

  removeItem(index: number): void {
    this.itemRemove.emit(index);
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
