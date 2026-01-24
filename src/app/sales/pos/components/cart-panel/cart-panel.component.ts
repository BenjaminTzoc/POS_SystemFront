import { Component, inject, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosService } from '../../services/pos.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="flex flex-col h-full">
      <!-- Cart Header -->
      <div
        class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50"
      >
        <div class="flex items-center gap-2 text-gray-800">
          <i class="pi pi-shopping-cart text-lg"></i>
          <span class="font-bold text-lg">Orden Actual</span>
          <span
            class="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium"
            *ngIf="itemCount() > 0"
          >
            {{ itemCount() }} items
          </span>
        </div>
        <button
          *ngIf="itemCount() > 0"
          (click)="clearCart()"
          class="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
          title="Limpiar carrito"
        >
          <i class="pi pi-trash"></i>
        </button>
      </div>

      <!-- Cart Items List -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div
          *ngFor="let item of cartItems()"
          class="group flex items-start justify-between p-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div class="flex-1 min-w-0 pr-3">
            <h4 class="font-medium text-gray-800 text-sm truncate">{{ item.product.name }}</h4>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ item.unitPrice | currency: 'Q ' }} x {{ item.quantity }}
            </div>
          </div>

          <div class="flex flex-col items-end gap-1">
            <span class="font-bold text-gray-800 text-sm">{{ item.total | currency: 'Q ' }}</span>

            <!-- Quick Actions -->
            <div
              class="flex items-center bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden scale-90 origin-right transition-opacity opacity-50 group-hover:opacity-100"
            >
              <button
                (click)="updateQty(item.product.id, item.quantity - 1)"
                class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600"
              >
                <i class="pi pi-minus text-xs"></i>
              </button>
              <span class="w-8 text-center text-xs font-medium">{{ item.quantity }}</span>
              <button
                (click)="updateQty(item.product.id, item.quantity + 1)"
                class="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600"
              >
                <i class="pi pi-plus text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          *ngIf="itemCount() === 0"
          class="h-64 flex flex-col items-center justify-center text-gray-400"
        >
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <i class="pi pi-shopping-bag text-3xl opacity-50"></i>
          </div>
          <p class="text-sm">Su carrito está vacío</p>
          <p class="text-xs mt-1 opacity-75">Escanee o seleccione productos</p>
        </div>
      </div>

      <!-- Totals Section -->
      <div class="p-6 bg-gray-50 border-t border-gray-200">
        <div class="space-y-2 mb-4 text-sm">
          <div class="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{{ subtotal() | currency: 'Q ' }}</span>
          </div>
          <!-- Tax logic can be added here if needed -->
          <!-- <div class="flex justify-between text-gray-600">
                    <span>Impuestos</span>
                    <span>{{tax() | currency:'Q '}}</span>
                </div> -->
        </div>

        <div class="flex justify-between items-center text-xl font-bold text-gray-900 mb-6">
          <span>Total</span>
          <span>{{ total() | currency: 'Q ' }}</span>
        </div>

        <button
          class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          [disabled]="itemCount() === 0"
          (click)="onCheckout()"
        >
          <span>Cobrar</span>
          <i class="pi pi-arrow-right text-sm"></i>
        </button>
      </div>
    </div>
  `,
})
export class CartPanelComponent {
  private posService = inject(PosService);

  @Output() checkout = new EventEmitter<void>();

  cartItems = this.posService.cart;
  subtotal = this.posService.subtotal;
  total = this.posService.total;
  itemCount = this.posService.itemCount;

  updateQty(id: string, qty: number) {
    this.posService.updateQuantity(id, qty);
  }

  clearCart() {
    this.posService.clearCart();
  }

  onCheckout() {
    this.checkout.emit();
  }
}
