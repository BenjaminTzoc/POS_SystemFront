import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SaleCalculatorService {
  private readonly TAX_RATE = 12;

  /**
   * Calculate a single line total (no global discounts applied)
   */
  calculateLine(detail: SaleDetailCalc): SaleDetailCalc {
    const unitPrice = Number(detail.unitPrice || 0);
    const qty = Number(detail.quantity || 0);
    const discountPercent = Number(detail.discount || 0);
    const taxPercent = Number(detail.taxPercentage || 0);

    const lineSubtotal = +(unitPrice * qty);
    const discountAmount = +(lineSubtotal * (discountPercent / 100));
    const subtotalAfterLineDiscount = +(lineSubtotal - discountAmount);
    const taxAmount = +(subtotalAfterLineDiscount * (taxPercent / 100));
    const lineTotal = +(subtotalAfterLineDiscount + taxAmount);

    return {
      ...detail,
      lineSubtotal: +lineSubtotal.toFixed(2),
      discountAmount: +discountAmount.toFixed(2),
      subtotalAfterLineDiscount: +subtotalAfterLineDiscount.toFixed(2),
      taxAmount: +taxAmount.toFixed(2),
      lineTotal: +lineTotal.toFixed(2),
    };
  }

  /**
   * Calculate totals for entire sale.
   * - details: array of SaleDetailCalc (quantity, unitPrice, discount, taxPercentage)
   * - discounts: global discounts array [{type, value}]
   */
  calculateTotals(
    details: SaleDetailCalc[],
    discounts: DiscountInput = [],
    applyTax: boolean = true
  ): SaleTotals {
    console.log(details, discounts, applyTax);
    const lines = details.map((d) => this.calculateLine(d));

    const subtotal = lines.reduce((s, l) => s + (l.lineSubtotal || 0), 0);
    const lineDiscountTotal = lines.reduce((s, l) => s + (l.discountAmount || 0), 0);

    const subtotalAfterLineDiscounts = +(subtotal - lineDiscountTotal);

    // ----------------------- DESCUENTOS GLOBALES -----------------------
    const processedDiscounts = discounts.map((d) => ({
      ...d,
      value: Number(d.value), // ← Convertir siempre a número
    }));

    let globalDiscountTotal = 0;
    for (const d of processedDiscounts || []) {
      if (!d || typeof d.value !== 'number') continue;
      if (d.type === 'percent') {
        globalDiscountTotal += +(subtotalAfterLineDiscounts * (d.value / 100));
      } else {
        globalDiscountTotal += +d.value;
      }
    }
    globalDiscountTotal = +globalDiscountTotal.toFixed(2);

    const subtotalWithDiscount = +(subtotalAfterLineDiscounts - globalDiscountTotal);

    // ----------------------- IMPUESTO GENERAL -----------------------
    let taxTotal = 0;
    if (applyTax) {
      taxTotal = +(subtotalWithDiscount * (this.TAX_RATE / 100)).toFixed(2);
    }

    // ----------------------- CALCULAR LINEAS FINALES -----------------------
    const linesWithGlobal = lines.map((l) => {
      const lineBase = l.subtotalAfterLineDiscount || 0;
      let proportion = 0;
      if (subtotalAfterLineDiscounts > 0) {
        proportion = lineBase / subtotalAfterLineDiscounts;
      }

      const lineGlobalDiscountApplied = +(globalDiscountTotal * proportion);
      const baseAfterAllDiscounts = +(lineBase - lineGlobalDiscountApplied);

      const lineTax = applyTax ? +(taxTotal * proportion) : 0;

      return {
        ...l,
        globalDiscountApplied: +lineGlobalDiscountApplied.toFixed(2),
        taxAmount: +lineTax.toFixed(2),
        lineTotal: +(baseAfterAllDiscounts + lineTax).toFixed(2),
      };
    });

    const discountTotal = +(lineDiscountTotal + globalDiscountTotal);
    const total = +(subtotalWithDiscount + taxTotal);

    return {
      subtotal: +subtotal.toFixed(2),
      lineDiscountTotal: +lineDiscountTotal.toFixed(2),
      globalDiscountTotal: +globalDiscountTotal.toFixed(2),
      discountTotal: +discountTotal.toFixed(2),
      subtotalWithDiscount: +subtotalWithDiscount.toFixed(2),
      taxTotal,
      total,
      lines: linesWithGlobal,
    };
  }
}

export type DiscountInput = { type: 'percent' | 'amount'; value: number }[];

export interface SaleDetailCalc {
  productId?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxPercentage?: number;

  lineSubtotal?: number;
  discountAmount?: number;
  subtotalAfterLineDiscount?: number;
  globalDiscountApplied?: number;
  taxAmount?: number;
  lineTotal?: number;
}

export interface SaleTotals {
  subtotal: number;
  lineDiscountTotal: number;
  globalDiscountTotal: number;
  discountTotal: number;
  subtotalWithDiscount: number;
  taxTotal: number;
  total: number;

  lines?: SaleDetailCalc[];
}
