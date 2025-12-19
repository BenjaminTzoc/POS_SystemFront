import { Injectable } from '@angular/core';
import { ISaleDetailPayload } from '../interfaces/sale-order.interface';
import { SaleCalculatorService } from './sale-calculator.service';
import { Product } from '../../inventory/interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class SaleDetailManagerService {
  private details: ISaleDetailPayload[] = [];

  constructor(private calculator: SaleCalculatorService) {}

  getDetails(): ISaleDetailPayload[] {
    return this.details;
  }

  setDetails(details: ISaleDetailPayload[]): void {
    this.details = details.map((d) => {
      const line = this.calculator.calculateLine(d);
      return {
        ...d,
        lineSubtotal: line.lineSubtotal,
        lineTotal: line.lineTotal,
      };
    });
  }

  clear(): void {
    this.details = [];
  }

  addProduct(product: Product): void {
    const existing = this.details.find((d) => d.product?.id === product.id);

    if (existing) {
      existing.quantity += 1;

      const line = this.calculator.calculateLine(existing);
      existing.lineSubtotal = line.lineSubtotal;
      existing.lineTotal = line.lineTotal;
      return;
    }

    const newDetail: ISaleDetailPayload = {
      product,
      quantity: 1,
      unitPrice: Number(product.price || 0),
      lineSubtotal: 0,
      lineTotal: 0,
    };

    const line = this.calculator.calculateLine(newDetail);
    newDetail.lineSubtotal = line.lineSubtotal;
    newDetail.lineTotal = line.lineTotal;

    this.details.push(newDetail);
  }

  removeDetail(index: number): void {
    if (index >= 0 && index < this.details.length) {
      this.details.splice(index, 1);
    }
  }

  updateQuantity(detail: ISaleDetailPayload, newQuantity: number): void {
    if (newQuantity <= 0) newQuantity = 0.001;

    detail.quantity = newQuantity;

    const line = this.calculator.calculateLine(detail);
    detail.lineSubtotal = line.lineSubtotal;
    detail.lineTotal = line.lineTotal;
  }

  updateUnitPrice(detail: ISaleDetailPayload, newPrice: number): void {
    if (newPrice < 0) newPrice = 0;

    detail.unitPrice = newPrice;

    const line = this.calculator.calculateLine(detail);
    detail.lineSubtotal = line.lineSubtotal;
    detail.lineTotal = line.lineTotal;
  }
}
