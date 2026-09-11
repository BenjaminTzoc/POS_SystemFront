import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'pos_product_quick_qty';

@Injectable({
  providedIn: 'root',
})
export class QuickQuantityService {
  private quantitiesMap = signal<Record<string, number>>({});

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          this.quantitiesMap.set(parsed);
        }
      }
    } catch (e) {
      console.error('Error al cargar cantidades rápidas de localStorage:', e);
    }
  }

  getQuantity(productId: string): number {
    const qty = this.quantitiesMap()[productId];
    return qty !== undefined && qty > 0 ? qty : 1;
  }

  setQuantity(productId: string, quantity: number): void {
    const val = Number(quantity);
    const validQty = !isNaN(val) && val > 0 ? val : 1;
    const current = { ...this.quantitiesMap() };
    current[productId] = validQty;

    this.quantitiesMap.set(current);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('Error al guardar cantidad rápida en localStorage:', e);
    }
  }
}
