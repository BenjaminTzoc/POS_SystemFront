import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { ProductRibbonComponent } from '../../../shared/components/product-ribbon/product-ribbon.component';
import { CustomersService } from '../../services/customers.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { ICustomerProductPrice } from '../../interfaces/customer.interface';
import { Product } from '../../../inventory/interfaces/product.interface';
import { AuthService } from '../../../auth/auth.service';
import { environment } from '../../../../environments/environment';

export interface CustomerPriceRow {
  productId: string;
  price: number;
  priceLabel: string;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  product?: ICustomerProductPrice['product'] & { imageUrl?: string };
}

@Component({
  selector: 'app-customer-product-prices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    TooltipModule,
    ConfirmationModalComponent,
    StandardTableComponent,
    ProductRibbonComponent,
  ],
  templateUrl: './customer-product-prices.component.html',
})
export class CustomerProductPricesComponent implements OnInit {
  @Input() customerId: string | null = null;

  private customersService = inject(CustomersService);
  private productsService = inject(ProductsService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  rows = signal<CustomerPriceRow[]>([]);
  catalog = signal<Product[]>([]);
  loadingPrices = signal(false);
  loadingCatalog = signal(false);

  private originalIds = new Set<string>();
  pendingDelete: CustomerPriceRow | null = null;
  showDeleteModal = false;

  get canView(): boolean {
    return this.authService.hasPermission('customers.view') || this.canManage;
  }

  get canManage(): boolean {
    return this.authService.hasPermission('customers.manage');
  }

  get ribbonProducts(): Product[] {
    const taken = new Set(this.rows().map((row) => row.productId));
    return this.catalog().filter((product) => !taken.has(product.id));
  }

  isRowSelected = (productId: string): boolean =>
    this.rows().some((row) => row.productId === productId);

  ngOnInit(): void {
    if (!this.canView) return;
    this.loadCatalog();
    if (this.customerId) this.loadPrices();
  }

  persist(customerId: string): Observable<void> {
    this.rows().forEach((row) => this.commitPrice(row));
    const current = this.rows();
    const currentIds = new Set(current.map((row) => row.productId));
    const toDelete = [...this.originalIds].filter((id) => !currentIds.has(id));

    const requests: Observable<unknown>[] = [
      ...current.map((row) => this.saveRowRequest(customerId, row)),
      ...toDelete.map((productId) => this.customersService.deleteProductPrice(customerId, productId)),
    ];

    if (requests.length === 0) return of(undefined);

    return forkJoin(requests).pipe(
      map(() => {
        this.originalIds = currentIds;
        return undefined;
      }),
    );
  }

  onRibbonSelect(event: { product: Product }): void {
    if (!this.canManage) return;
    const product = event.product;
    if (this.rows().some((row) => row.productId === product.id)) return;

    this.rows.update((rows) => [
      ...rows,
      {
        productId: product.id,
        price: Number(product.price || 0),
        priceLabel: this.asCents(Number(product.price || 0)),
        isActive: true,
        validFrom: null,
        validUntil: null,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          imageUrl: product.imageUrl,
        },
      },
    ]);
  }

  confirmDelete(row: CustomerPriceRow): void {
    this.pendingDelete = row;
    this.showDeleteModal = true;
  }

  deletePending(): void {
    const row = this.pendingDelete;
    if (!row) return;
    this.rows.update((rows) => rows.filter((item) => item.productId !== row.productId));
    this.pendingDelete = null;
    this.showDeleteModal = false;
  }

  listPrice(row: CustomerPriceRow): number {
    return Number(row.product?.price ?? 0);
  }

  productImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  selectPrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    queueMicrotask(() => input.select());
  }

  commitPrice(row: CustomerPriceRow): void {
    const parsed = Number(String(row.priceLabel || '0').replace(',', '.'));
    row.price = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
    row.priceLabel = this.asCents(row.price);
  }

  private loadCatalog(): void {
    this.loadingCatalog.set(true);
    this.productsService.getProducts().subscribe({
      next: (res) => {
        this.catalog.set(res.statusCode === 200 ? this.flattenCatalog(res.data || []) : []);
        this.loadingCatalog.set(false);
        this.hydrateFromCatalog();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el catálogo de productos.',
        });
        this.catalog.set([]);
        this.loadingCatalog.set(false);
      },
    });
  }

  private loadPrices(): void {
    if (!this.customerId) return;
    this.loadingPrices.set(true);
    this.customersService.getProductPrices(this.customerId).subscribe({
      next: (res) => {
        const data = res.data as unknown;
        const list = Array.isArray(data)
          ? data
          : ((data as { prices?: ICustomerProductPrice[] })?.prices
            || (data as { items?: ICustomerProductPrice[] })?.items
            || []);
        const rows = list.map((row) => {
          const price = Number(row.price);
          return {
            productId: row.productId || row.product?.id || '',
            price,
            priceLabel: this.asCents(price),
            isActive: true,
            validFrom: this.toDateInput(row.validFrom),
            validUntil: this.toDateInput(row.validUntil),
            product: row.product,
          };
        });
        this.rows.set(rows);
        this.originalIds = new Set(rows.map((row) => row.productId));
        this.loadingPrices.set(false);
        this.hydrateFromCatalog();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron cargar los precios pactados.',
        });
        this.loadingPrices.set(false);
      },
    });
  }

  private saveRowRequest(customerId: string, row: CustomerPriceRow): Observable<unknown> {
    const body = {
      price: Number(row.price),
      isActive: row.isActive !== false,
      validFrom: row.validFrom || null,
      validUntil: row.validUntil || null,
    };
    return this.customersService.updateProductPrice(customerId, row.productId, body).pipe(
      catchError(() =>
        this.customersService.upsertProductPrice(customerId, {
          productId: row.productId,
          ...body,
        }),
      ),
    );
  }

  private flattenCatalog(products: Product[]): Product[] {
    const items: Product[] = [];
    for (const product of products) {
      if (product.isMaster && product.variants?.length) {
        for (const variant of product.variants) {
          items.push({
            ...variant,
            imageUrl: variant.imageUrl || product.imageUrl,
            unit: variant.unit || product.unit,
          });
        }
        continue;
      }
      if (!product.isMaster) items.push(product);
    }
    return items;
  }

  private toDateInput(value?: string | null): string | null {
    if (!value) return null;
    return String(value).slice(0, 10);
  }

  private asCents(value: number): string {
    return Number(value || 0).toFixed(2);
  }

  private hydrateFromCatalog(): void {
    if (this.catalog().length === 0 || this.rows().length === 0) return;
    const byId = new Map(this.catalog().map((product) => [product.id, product]));
    this.rows.update((rows) =>
      rows.map((row) => {
        const product = byId.get(row.productId);
        if (!product) return row;
        return {
          ...row,
          product: {
            id: product.id,
            name: row.product?.name || product.name,
            sku: row.product?.sku || product.sku,
            price: row.product?.price ?? product.price,
            imageUrl: row.product?.imageUrl || product.imageUrl,
          },
        };
      }),
    );
  }
}
