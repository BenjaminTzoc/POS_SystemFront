import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { PaymentMethodsService } from '../../../services/payment-methods.service';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DialogModule, ButtonModule, InputNumberModule],
  template: `
    <p-dialog
      [visible]="visible"
      [modal]="true"
      [style]="{ width: '500px' }"
      (onHide)="onCancel()"
      header="Procesar Pago"
      styleClass="p-0 overflow-hidden"
    >
      <div class="flex flex-col gap-6 pt-4">
        <!-- Total Amount Display -->
        <div class="bg-gray-50 p-6 rounded-xl text-center">
          <p class="text-gray-500 text-sm font-medium uppercase tracking-wide mb-1">
            Total a Pagar
          </p>
          <p class="text-4xl font-bold text-gray-900">{{ total | currency: 'Q ' }}</p>
        </div>

        <!-- Payment Method Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              *ngFor="let method of paymentMethods"
              (click)="selectedMethod = method.id"
              [class.ring-2]="selectedMethod === method.id"
              [class.ring-indigo-600]="selectedMethod === method.id"
              [class.bg-indigo-50]="selectedMethod === method.id"
              [class.text-indigo-700]="selectedMethod === method.id"
              class="p-3 border rounded-lg text-center font-medium transition-all hover:bg-gray-50 flex flex-col items-center gap-1"
            >
              <i [class]="method.icon || 'pi pi-wallet'" class="text-xl"></i>
              {{ method.name }}
            </button>
            <!-- Fallback if no methods loaded -->
            <button
              *ngIf="paymentMethods.length === 0"
              class="p-3 border rounded-lg text-center font-medium bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600"
            >
              <i class="pi pi-money-bill text-xl"></i>
              Efectivo
            </button>
          </div>
        </div>

        <!-- Numpad & Input -->
        <div *ngIf="isCashSelected()" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Efectivo Recibido</label
                >
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold"
                    >Q</span
                  >
                  <input
                    type="number"
                    [(ngModel)]="amountTendered"
                    class="w-full pl-8 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xl font-bold text-gray-900"
                    placeholder="0.00"
                    readonly
                  />
                  <button
                    *ngIf="amountTendered"
                    (click)="amountTendered = null"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                  >
                    <i class="pi pi-times-circle"></i>
                  </button>
                </div>
              </div>

              <!-- Quick Cash Buttons -->
              <div class="grid grid-cols-2 gap-2">
                <button
                  *ngFor="let amount of quickAmounts"
                  (click)="amountTendered = amount"
                  class="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-semibold text-gray-700 transition-colors"
                >
                  Q {{ amount }}
                </button>
                <button
                  (click)="amountTendered = total"
                  class="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-md text-sm font-semibold text-indigo-700 transition-colors"
                >
                  Exacto
                </button>
              </div>
            </div>

            <!-- Numpad -->
            <div class="grid grid-cols-3 gap-2">
              <button
                *ngFor="let key of [1, 2, 3, 4, 5, 6, 7, 8, 9]"
                (click)="onNumpadClick(key)"
                class="h-12 bg-white border border-gray-200 rounded-lg text-xl font-medium hover:bg-gray-50 active:bg-gray-100 shadow-sm transition-all"
              >
                {{ key }}
              </button>
              <button
                (click)="onNumpadClick('.')"
                class="h-12 bg-white border border-gray-200 rounded-lg text-xl font-medium hover:bg-gray-50 text-gray-500"
              >
                .
              </button>
              <button
                (click)="onNumpadClick(0)"
                class="h-12 bg-white border border-gray-200 rounded-lg text-xl font-medium hover:bg-gray-50"
              >
                0
              </button>
              <button
                (click)="onBackspace()"
                class="h-12 bg-white border border-gray-200 rounded-lg text-xl font-medium hover:bg-red-50 text-red-500"
              >
                <i class="pi pi-delete-left"></i>
              </button>
            </div>
          </div>

          <!-- Change Display -->
          <div
            class="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-100"
          >
            <span class="font-medium text-green-800">Su Cambio:</span>
            <span class="text-2xl font-bold text-green-700">{{
              change > 0 ? (change | currency: 'Q ') : 'Q 0.00'
            }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-2">
          <button
            pButton
            label="Cancelar"
            class="p-button-outlined flex-1"
            (click)="onCancel()"
          ></button>
          <button
            pButton
            label="Confirmar Cobro"
            class="flex-1 p-button-primary bg-indigo-600 border-indigo-600 hover:bg-indigo-700"
            [disabled]="!isValid()"
            (click)="onConfirm()"
          ></button>
        </div>
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host ::ng-deep .p-dialog-header {
        padding: 1.5rem 1.5rem 0.5rem 1.5rem;
      }
      :host ::ng-deep .p-dialog-content {
        padding: 0 1.5rem 1.5rem 1.5rem;
      }
    `,
  ],
})
export class CheckoutDialogComponent implements OnInit {
  @Input() visible = false;
  @Input() total = 0;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmPayment = new EventEmitter<{ methodId: string; amountTendered: number }>();

  private paymentMethodsService = inject(PaymentMethodsService);

  paymentMethods: any[] = [];
  selectedMethod: string | null = null;
  amountTendered: number | null = null;
  quickAmounts = [10, 20, 50, 100, 200];

  ngOnInit() {
    this.paymentMethodsService.getPaymentMethods().subscribe((res) => {
      const methods = res.data;
      this.paymentMethods = methods;
      if (methods.length > 0) {
        // Default to Cash if available, otherwise first
        const cash = methods.find(
          (m: any) =>
            m.name.toLowerCase().includes('efectivo') || m.name.toLowerCase().includes('cash'),
        );
        this.selectedMethod = cash ? cash.id : methods[0].id;
      }
    });
  }

  isCashSelected(): boolean {
    if (!this.selectedMethod) return false;
    const method = this.paymentMethods.find((m) => m.id === this.selectedMethod);
    // Fallback logic if methods usually imply cash
    if (!method && this.selectedMethod) return true;
    return method
      ? method.name.toLowerCase().includes('efectivo') || method.name.toLowerCase().includes('cash')
      : true;
  }

  get change(): number {
    if (!this.amountTendered) return 0;
    return Math.max(0, this.amountTendered - this.total);
  }

  onNumpadClick(key: number | string) {
    const current = this.amountTendered ? this.amountTendered.toString() : '';
    if (key === '.' && current.includes('.')) return;
    this.amountTendered = parseFloat(current + key);
  }

  onBackspace() {
    const current = this.amountTendered ? this.amountTendered.toString() : '';
    if (current.length <= 1) {
      this.amountTendered = null;
    } else {
      this.amountTendered = parseFloat(current.slice(0, -1));
    }
  }

  isValid(): boolean {
    if (!this.selectedMethod) return false;
    if (this.isCashSelected()) {
      return (this.amountTendered || 0) >= this.total;
    }
    return true;
  }

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.amountTendered = null; // Reset
  }

  onConfirm() {
    if (this.isValid() && this.selectedMethod) {
      this.confirmPayment.emit({
        methodId: this.selectedMethod,
        amountTendered: this.amountTendered || 0,
      });
      this.onCancel();
    }
  }
}
