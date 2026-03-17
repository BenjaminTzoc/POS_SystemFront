import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../inventory/interfaces/product.interface';
import { PosService } from '../../services/pos.service';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      *ngIf="!isLoading; else loadingTpl"
    >
      <div
        *ngFor="let product of products"
        (click)="onProductClick(product)"
        class="group bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col h-full active:scale-95"
      >
        <div
          class="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative border border-gray-200 text-slate-300"
        >
          <img
            *ngIf="product.imageUrl"
            [src]="product.imageUrl"
            alt="{{ product.name }}"
            class="w-full h-full object-cover"
          />
          <i *ngIf="!product.imageUrl" class="pi pi-image text-3xl"></i>

          <!-- Stock Badge -->
          <span
            class="absolute top-1 right-1 bg-white/90 backdrop-blur text-xs px-1.5 py-0.5 rounded text-gray-600 font-medium"
          >
            {{ product.stock }}
          </span>
        </div>

        <h3
          class="font-medium text-gray-800 text-sm line-clamp-2 leading-tight mb-auto group-hover:text-indigo-600"
        >
          {{ product.name }}
        </h3>

        <div
          class="mt-2 pt-2 border-t border-dashed border-gray-100 flex items-end justify-between"
        >
          <span class="text-indigo-600 font-bold">Q{{ product.price }}</span>
          <button
            class="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors"
          >
            <i class="pi pi-plus text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State if no products -->
    <div
      *ngIf="products.length === 0 && !isLoading"
      class="flex flex-col items-center justify-center h-full text-gray-500"
    >
      <i class="pi pi-search text-4xl mb-3"></i>
      <p>No se encontraron productos</p>
    </div>

    <ng-template #loadingTpl>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          *ngFor="let i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]"
          class="bg-white rounded-xl p-3 h-48 animate-pulse border border-gray-100"
        >
          <div class="bg-gray-200 w-full aspect-square rounded-lg mb-3"></div>
          <div class="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
          <div class="bg-gray-200 h-4 w-1/2 rounded"></div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [],
})
export class ProductGridComponent {
  @Input() products: Product[] = [];
  @Input() isLoading = false;

  private posService = inject(PosService);

  onProductClick(product: Product) {
    this.posService.addToCart(product);
  }
}
