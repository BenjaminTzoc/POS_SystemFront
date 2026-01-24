import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../../../inventory/interfaces/product.interface';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number; // Stored separately in case of overrides
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class PosService {
  // Signals for reactive state
  cart = signal<CartItem[]>([]);
  selectedCategory = signal<string | null>(null);

  // Computed values for totals
  subtotal = computed(() => this.cart().reduce((acc, item) => acc + item.total, 0));
  tax = computed(() => 0); // Implement tax logic later
  total = computed(() => this.subtotal() + this.tax());
  itemCount = computed(() => this.cart().reduce((acc, item) => acc + item.quantity, 0));

  addToCart(product: Product) {
    this.cart.update((currentCart) => {
      const existingItem = currentCart.find((item) => item.product.id === product.id);

      if (existingItem) {
        // Update existing item
        return currentCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item,
        );
      } else {
        // Add new item
        const price = parseFloat(product.price);
        return [
          ...currentCart,
          {
            product,
            quantity: 1,
            unitPrice: price,
            total: price,
          },
        ];
      }
    });
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cart.update((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, total: quantity * item.unitPrice }
          : item,
      ),
    );
  }

  removeFromCart(productId: string) {
    this.cart.update((currentCart) => currentCart.filter((item) => item.product.id !== productId));
  }

  clearCart() {
    this.cart.set([]);
  }

  setCategory(categoryId: string | null) {
    this.selectedCategory.set(categoryId);
  }
}
