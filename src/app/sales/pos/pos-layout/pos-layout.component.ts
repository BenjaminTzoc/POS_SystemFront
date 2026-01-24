import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { ApiResponse } from '../../../core/models/api-response.model';
import { ProductCategory } from '../../../inventory/interfaces/product-category.interface';

// Services
import { PosService } from '../services/pos.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { ProductCategoriesService } from '../../../inventory/services/product-categories.service';
import { OrdersService } from '../../services/orders.service';
import { SalePaymentsService } from '../../services/sale-payments.service';
import { AuthService } from '../../../auth/auth.service';

// Components
import { ProductGridComponent } from '../components/product-grid/product-grid.component';
import { CartPanelComponent } from '../components/cart-panel/cart-panel.component';
import { CategorySelectorComponent } from '../components/category-selector/category-selector.component';
import { CheckoutDialogComponent } from '../components/checkout-dialog/checkout-dialog.component';

// Interfaces
import { Product } from '../../../inventory/interfaces/product.interface';

@Component({
  selector: 'app-pos-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    ProductGridComponent,
    CartPanelComponent,
    CategorySelectorComponent,
    CheckoutDialogComponent,
  ],
  providers: [MessageService],
  templateUrl: './pos-layout.component.html',
  styleUrl: './pos-layout.component.css',
})
export class PosLayoutComponent implements OnInit {
  public posService = inject(PosService);
  private productsService = inject(ProductsService);
  private categoriesService = inject(ProductCategoriesService);
  private ordersService = inject(OrdersService);
  private salePaymentsService = inject(SalePaymentsService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  selectedCategory: string | null = null;
  searchTerm: string = '';
  isLoading = false;
  isCheckoutVisible = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.productsService.getProducts().subscribe({
      next: (res: ApiResponse<Product[]>) => {
        this.products = res.data;
        this.filterProducts();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading products', err);
        this.isLoading = false;
      },
    });

    this.categoriesService.getAllCategories().subscribe({
      next: (res: ApiResponse<ProductCategory[]>) => {
        this.categories = res.data;
      },
      error: (err: any) => {
        console.error('Error loading categories', err);
      },
    });
  }

  // Checkout & Payment Logic
  onCheckout() {
    this.isCheckoutVisible = true;
  }

  async handlePayment(paymentData: { methodId: string; amountTendered: number }) {
    try {
      this.isLoading = true;
      const user: any = this.authService.currentUser;
      const branchId = user?.branchId || user?.branch?.id; // Adjust based on actual user object structure

      if (!branchId) {
        throw new Error('No se pudo determinar la sucursal del usuario.');
      }

      // 1. Create Sale Order
      const salePayload = {
        branchId: branchId,
        date: new Date(),
        dueDate: new Date(),
        notes: 'Venta Rápida (POS)',
        guestCustomer: {
          name: 'Consumidor Final',
          phone: '00000000',
          nit: 'CF',
        },
        details: this.posService.cart().map((item) => ({
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.total,
        })),
        applyTax: true, // Default to true
      };

      const createRes = await firstValueFrom(this.ordersService.createSale(salePayload));
      if (!createRes || createRes.statusCode !== 201) throw new Error('Error al crear la orden');
      const saleId = createRes.data.id;

      // 2. Confirm Sale
      const confirmRes = await firstValueFrom(this.ordersService.confirmSale(saleId));
      if (!confirmRes) throw new Error('Error al confirmar la venta');

      // 3. Register Payment
      const paymentPayload = {
        saleId: saleId,
        paymentMethodId: paymentData.methodId,
        amount: this.posService.total(), // Pay full amount
        date: new Date().toISOString().split('T')[0],
        notes: 'Pago POS',
      };

      await firstValueFrom(this.salePaymentsService.createSalePayment(paymentPayload));

      // 4. Deliver Sale (Optional, but logical for POS)
      await firstValueFrom(this.ordersService.deliverSale(saleId));

      // Success
      this.messageService.add({
        severity: 'success',
        summary: 'Venta Exitosa',
        detail: 'La venta se ha procesado correctamente.',
      });
      this.posService.clearCart();
      this.isCheckoutVisible = false;

      // Navigate to order details to view/print ticket
      // In the future, we can implement direct printing here
      setTimeout(() => {
        this.router.navigate(['/sales/orders', saleId]);
      }, 1500);
    } catch (error: any) {
      console.error(error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Ocurrió un error al procesar la venta.',
      });
    } finally {
      this.isLoading = false;
    }
  }

  onCategorySelect(categoryId: string | null) {
    this.selectedCategory = categoryId;
    this.filterProducts();
  }

  onSearch(term: string) {
    this.searchTerm = term;
    this.filterProducts();
  }

  filterProducts() {
    let filtered = this.products;

    // Filter by Category
    if (this.selectedCategory) {
      filtered = filtered.filter((p) => p.category?.id === this.selectedCategory);
    }

    // Filter by Search Term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(term) || p.barcode?.toLowerCase().includes(term),
      );
    }

    this.filteredProducts = filtered;
  }
}
