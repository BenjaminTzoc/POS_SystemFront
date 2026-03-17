import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormArray,
} from '@angular/forms';
import { Button, ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Supplier } from '../../interfaces/supplier.interface';
import { SelectModule } from 'primeng/select';
import { CreatePurchase, IPurchaseOrderResponse } from '../../interfaces/purchase-order.interface';
import { OrdersService } from '../../services/orders.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SuppliersService } from '../../services/suppliers.service';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { environment } from '../../../../environments/environment';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { WebsocketService } from '../../services/websocket.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { TagModule } from 'primeng/tag';
import { ProductsService } from '../../../inventory/services/products.service';
import { Product, ProductType } from '../../../inventory/interfaces/product.interface';

export enum PurchaseStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Component({
  selector: 'app-purchase-order-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    TextareaModule,
    SelectModule,
    CurrencyPipe,
    TableModule,
    DialogModule,
    FormsModule,
    InputNumberModule,
    TagModule,
    Button,
    TooltipModule,
  ],
  templateUrl: './purchase-order-form.component.html',
  styleUrl: './purchase-order-form.component.css',
})
export class PurchaseOrderFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private suppliersService = inject(SuppliersService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private websocketService = inject(WebsocketService);
  private destroy$ = new Subject<void>();

  statusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Parcialmente Pagado', value: 'partially_paid' },
    { label: 'Pagado', value: 'paid' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  orderForm!: FormGroup;
  productForm!: FormGroup;
  suppliers: Supplier[] = [];
  purchaseData: IPurchaseOrderResponse = {} as IPurchaseOrderResponse;
  get orderDetails(): FormArray {
    return this.orderForm.get('details') as FormArray;
  }

  dialogVisible: boolean = false;
  products = signal<Product[]>([]);
  selectedProduct: Product | undefined = undefined;

  ngOnInit(): void {
    this.initializeForm();
    this.loadSuppliers();
    this.loadProducts();
    this.setupWebSocketListeners();
    this.ordersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseData.invoiceNumber = res.data.nextNumber;
          this.orderForm.get('invoiceNumber')?.setValue(this.purchaseData.invoiceNumber);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error generando número de orden: ${err.error.message}`,
        });
        this.router.navigate(['/purchases/orders']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupWebSocketListeners(): void {
    this.websocketService
      .onNewPurchaseCreated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Nueva orden creada',
          detail: `Otro usuario creó la orden: ${data.data.invoiceNumber}`,
          life: 5000,
        });

        this.loadNextInvoiceNumber();
      });

    this.websocketService
      .onNextInvoiceNumberUpdated()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const newNumber = data.data.nextInvoiceNumber;

        if (this.orderForm.get('invoiceNumber')?.value !== newNumber) {
          this.orderForm.get('invoiceNumber')?.setValue(newNumber);

          this.messageService.add({
            severity: 'success',
            summary: 'Número actualizado',
            detail: `Nuevo número de orden: ${newNumber}`,
            life: 3000,
          });
        }
      });
  }

  loadNextInvoiceNumber(): void {
    this.ordersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.orderForm.get('invoiceNumber')?.setValue(res.data.nextNumber);
        }
      },
      error: (err) => {
        console.error('Error cargando número de orden:', err);
      },
    });
  }

  initializeForm(): void {
    this.orderForm = this.fb.group({
      invoiceNumber: ['', [Validators.required]],
      date: [new Date()],
      dueDate: [null],
      notes: [''],
      status: [''],
      supplierId: ['', [Validators.required]],
      details: this.fb.array([]),
    });

    this.productForm = this.fb.group({
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxPercentage: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  get orderDetailsForTable(): any[] {
    return this.orderDetails.controls.map((control) => ({
      formControl: control,
      data: control.value,
      lineTotal: this.calculateLineTotal(control.value),
    }));
  }

  loadSuppliers(): void {
    this.suppliersService.getSuppliers().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.suppliers = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo proveedores: ${err.error.message}`,
        });
        this.router.navigate(['/purchases/orders']);
      },
    });
  }

  loadProducts(): void {
    this.productsService.getProducts(undefined, false, undefined, undefined, false).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.products.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo productos: ${err.error.message}`,
        });
        this.dialogVisible = false;
      },
    });
  }

  addDetail(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const formValue = this.productForm.value;

    const detailGroup = this.fb.group({
      productId: [formValue.productId, [Validators.required]],
      quantity: [formValue.quantity, [Validators.required, Validators.min(0.01)]],
      unitPrice: [formValue.unitPrice, [Validators.required, Validators.min(0)]],
      taxPercentage: [formValue.taxPercentage, [Validators.min(0)]],
      discount: [formValue.discount, [Validators.min(0)]],
      product: [this.selectedProduct],
    });

    this.orderDetails.push(detailGroup);

    this.productForm.reset({
      quantity: 1,
      unitPrice: 0,
      taxPercentage: 0,
      discount: 0,
    });
    this.selectedProduct = undefined;
    this.dialogVisible = false;
  }

  removeDetail(index: number) {
    this.orderDetails.removeAt(index);
  }

  calculateLineTotal(detail: any): number {
    const unitPrice = detail.unitPrice || 0;
    const quantity = detail.quantity || 0;
    const discount = detail.discount || 0;
    const taxPercentage = detail.taxPercentage || 0;

    const subtotal = unitPrice * quantity;
    const discountAmount = subtotal * (discount / 100);
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = subtotalAfterDiscount * (taxPercentage / 100);

    return Number((subtotalAfterDiscount + taxAmount).toFixed(2));
  }

  calculateTotals(): {
    subtotal: number;
    discountTotal: number;
    subtotalWithDiscount: number;
    taxTotal: number;
    total: number;
  } {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    this.orderDetails.controls.forEach((control) => {
      const detail = control.value;
      const lineSubtotal = detail.quantity * detail.unitPrice;
      const lineDiscount = lineSubtotal * (detail.discount / 100);
      const lineTax = (lineSubtotal - lineDiscount) * (detail.taxPercentage / 100);

      subtotal += lineSubtotal;
      discountTotal += lineDiscount;
      taxTotal += lineTax;
    });

    const subtotalWithDiscount = subtotal - discountTotal;
    const total = subtotal - discountTotal + taxTotal;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      subtotalWithDiscount: Number(subtotalWithDiscount.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  onSupplierChange(event: any): void {
    const selectedSupplierId = event.value;

    this.suppliersService.getSupplier(selectedSupplierId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.purchaseData.supplier = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo datos del proveedor: ${err.error.message}`,
        });
      },
    });
  }

  showDialog(): void {
    this.dialogVisible = true;
  }

  onProductChange(event: any) {
    const selectedProductId = event.value;

    if (!selectedProductId) {
      this.selectedProduct = undefined;
      return;
    }

    this.productsService.getProduct(selectedProductId).subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          this.selectedProduct = response.data;
          this.productForm.get('unitPrice')?.setValue(Number(this.selectedProduct.price));
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando el producto: ${error.error.message}`,
        });
      },
    });
  }

  onSaveOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    if (this.orderDetails.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe agregar al menos un producto',
      });
      return;
    }

    const formData: CreatePurchase = {
      invoiceNumber: this.orderForm.get('invoiceNumber')?.value,
      date: new Date(this.orderForm.get('date')?.value),
      dueDate: this.orderForm.get('dueDate')?.value
        ? new Date(this.orderForm.get('dueDate')?.value)
        : undefined,
      supplierId: this.orderForm.get('supplierId')?.value,
      notes: this.orderForm.get('notes')?.value,
      details: this.orderDetails.controls.map((control) => {
        const detail = control.value;
        return {
          productId: detail.productId,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          discount: detail.discount,
          taxPercentage: detail.taxPercentage,
        };
      }),
    };

    this.ordersService.createPurchase(formData).subscribe({
      next: (res) => {
        if (res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Orden de compra creada correctamente',
          });
          this.router.navigate(['/purchases/orders']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error creando orden: ${err.error.message}`,
        });
      },
    });
  }

  onBack() {
    this.router.navigate(['/purchases/orders']);
  }

  onCancelProccess() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de cancelar este proceso?',
      header: 'Confirmar cancelación',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Regresar',
      rejectButtonProps: {
        label: 'Regresar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Cancelar proceso',
        severity: 'danger',
      },

      accept: () => {
        this.onBack();
      },
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }
}
