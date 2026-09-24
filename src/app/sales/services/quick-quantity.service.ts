import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pos_product_quick_qty';

@Injectable({
  providedIn: 'root',
})
export class QuickQuantityService {
  private quantitiesMap = signal<Record<string, number>>({});

  constructor() {
    this.clearAll();
  }

  getQuantity(productId: string): number {
    return this.peekQuantity(productId) ?? 1;
  }

  peekQuantity(productId: string): number | undefined {
    const qty = this.quantitiesMap()[productId];
    return qty !== undefined && qty > 0 ? qty : undefined;
  }

  setQuantity(productId: string, quantity: number): void {
    const val = Number(quantity);
    const validQty = !isNaN(val) && val > 0 ? val : 1;
    const current = { ...this.quantitiesMap() };
    current[productId] = validQty;

    this.quantitiesMap.set(current);
  }

  resetQuantity(productId: string): void {
    const current = { ...this.quantitiesMap() };
    delete current[productId];
    this.quantitiesMap.set(current);
  }

  clearAll(): void {
    this.quantitiesMap.set({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error al limpiar cantidades de localStorage:', e);
    }
  }
}
