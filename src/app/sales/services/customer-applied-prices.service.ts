import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CustomersService } from './customers.service';
import { ICustomerProductPrice } from '../interfaces/customer.interface';
import { Product } from '../../inventory/interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class CustomerAppliedPricesService {
  private customersService = inject(CustomersService);

  private customerId: string | null = null;
  private pricesByProduct = new Map<string, ICustomerProductPrice>();
  readonly ready = signal(false);

  get currentCustomerId(): string | null {
    return this.customerId;
  }

  clear(): void {
    this.customerId = null;
    this.pricesByProduct.clear();
    this.ready.set(false);
  }

  async loadForCustomer(customerId: string | null | undefined): Promise<void> {
    if (!customerId) {
      this.clear();
      return;
    }

    this.customerId = customerId;
    this.ready.set(false);

    try {
      const res = await firstValueFrom(this.customersService.getProductPrices(customerId));
      const rows = this.unwrapList(res.data);
      this.pricesByProduct.clear();
      for (const row of rows) {
        const productId = row.productId || row.product?.id;
        if (!productId) continue;
        this.pricesByProduct.set(productId, { ...row, productId, price: Number(row.price) });
      }
    } catch {
      this.pricesByProduct.clear();
    } finally {
      this.ready.set(true);
    }
  }

  unitPriceFor(product: Pick<Product, 'id' | 'price'>, listPrice = Number(product.price || 0)): number {
    const row = this.pricesByProduct.get(product.id);
    if (row && this.isCurrentlyValid(row)) return Number(row.price);
    return listPrice;
  }

  isCustom(productId: string): boolean {
    const row = this.pricesByProduct.get(productId);
    return !!(row && this.isCurrentlyValid(row));
  }

  async resolveUnitPrice(
    product: Pick<Product, 'id' | 'price'>,
    customerId?: string | null,
  ): Promise<number> {
    const listPrice = Number(product.price || 0);
    const id = customerId ?? this.customerId;
    if (!id) return listPrice;

    if (this.customerId === id && this.pricesByProduct.has(product.id)) {
      return this.unitPriceFor(product, listPrice);
    }

    try {
      const res = await firstValueFrom(this.customersService.getAppliedPrice(id, product.id));
      const data = res.data;
      if (data?.price != null) return Number(data.price);
    } catch {
      /* list price */
    }
    return listPrice;
  }

  private isCurrentlyValid(row: ICustomerProductPrice): boolean {
    if (row.isActive === false) return false;
    const now = Date.now();
    if (row.validFrom) {
      const from = new Date(row.validFrom).getTime();
      if (!Number.isNaN(from) && from > now) return false;
    }
    if (row.validUntil) {
      const until = new Date(row.validUntil).getTime();
      if (!Number.isNaN(until) && until < now) return false;
    }
    return true;
  }

  private unwrapList(data: unknown): ICustomerProductPrice[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      const anyData = data as { prices?: ICustomerProductPrice[]; items?: ICustomerProductPrice[]; data?: ICustomerProductPrice[] };
      return anyData.prices || anyData.items || anyData.data || [];
    }
    return [];
  }
}
