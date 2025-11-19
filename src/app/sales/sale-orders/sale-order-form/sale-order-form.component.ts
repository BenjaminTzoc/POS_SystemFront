//prettier-ignore
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { WebsocketService } from '../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { OrdersService } from '../../services/orders.service';
import { Router } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Product } from '../../../inventory/interfaces/product.interface';
import { environment } from '../../../../environments/environment';
import { InputNumberModule } from 'primeng/inputnumber';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ICustomer } from '../../interfaces/customer.interface';
import { CustomersService } from '../../services/customers.service';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ISaleDetailPayload } from '../../interfaces/sale-order.interface';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProductSearchComponent } from '../../../components/product-search/product-search.component';
import { SaleDiscountsComponent } from '../../../components/sale-discounts/sale-discounts.component';
import { SaleCalculatorService, SaleTotals } from '../../services/sale-calculator.service';
import { SaleDetailManagerService } from '../../services/sale-detail-manager.service';

@Component({
  selector: 'app-sale-order-form',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RadioButtonModule,
    FloatLabelModule,
    InputTextModule,
    CurrencyPipe,
    ButtonModule,
    DatePickerModule,
    TableModule,
    DialogModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    CommonModule,
    AutoCompleteModule,
    ProductSearchComponent,
    SaleDiscountsComponent,
  ],
  templateUrl: './sale-order-form.component.html',
  styleUrl: './sale-order-form.component.css',
})
export class SaleOrderFormComponent implements OnInit, OnDestroy {
  private saleCalculator = inject(SaleCalculatorService);
  private detailManager = inject(SaleDetailManagerService);
  private ordersService = inject(OrdersService);
  private customersService = inject(CustomersService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private websocketService = inject(WebsocketService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  selectedCustomerType: any = null;
  customerTypes: any[] = [
    { name: 'Cliente Registrado', value: 'R' }, //REGISTERED CUSTOMER
    { name: 'Encargo Rápido', value: 'Q' }, //QUICK ORDER
  ];

  statuses: any[] = [
    { name: 'Pendiente', value: 'pending' },
    { name: 'Confirmado', value: 'confirmed' },
    { name: 'En Preparación', value: 'preparing' },
    { name: 'Entregado', value: 'delivered' },
    { name: 'Cancelado', value: 'cancelled' },
    { name: 'En espera', value: 'on_hold' },
  ];

  discounts: any[] = [];

  totals: SaleTotals = {
    subtotal: 0,
    lineDiscountTotal: 0,
    globalDiscountTotal: 0,
    discountTotal: 0,
    subtotalWithDiscount: 0,
    taxTotal: 0,
    total: 0,
    lines: [],
  };

  orderForm!: FormGroup;
  productForm!: FormGroup;
  discountForm!: FormGroup;
  customers: ICustomer[] = [];
  selectedCustomer: ICustomer | null = null;

  showDiscountDialog: boolean = false;
  selectedDiscountType: any = null;
  discountTypes: any[] = [
    { name: 'Porcentaje (%)', value: 'percentage' },
    { name: 'Monto fijo (Q)', value: 'amount' },
  ];

  ngOnInit(): void {
    this.selectedCustomerType = this.customerTypes[0];
    this.selectedDiscountType = this.discountTypes[0];
    this.setupWebSocketListeners();
    this.initializeForm();
    this.loadCustomers();

    this.ordersService.getNextInvoiceNumber().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.orderForm.get('invoiceNumber')?.setValue(res.data.nextNumber);
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

  // -------------------- INICIO WEBSOCKET NUMERO ORDEN ---------------------
  setupWebSocketListeners(): void {
    this.websocketService
      .onNewSaleCreated()
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
  // -------------------- FIN WEBSOCKET NUMERO ORDEN ---------------------

  // -------------------- INICIO CATALOGOS ----------------------
  onCustomerTypeChange() {
    this.orderForm.get('customerId')?.markAsUntouched();
    if (this.selectedCustomerType?.value === 'R') {
      this.orderForm.get('customerId')!.setValidators([Validators.required]);

      this.orderForm.get('guestCustomer')!.get('name')!.clearValidators();
      this.orderForm.get('guestCustomer')!.get('phone')!.clearValidators();
      this.orderForm.get('guestCustomer')!.reset({ nit: 'CF' });
    } else {
      this.orderForm.get('customerId')!.clearValidators();
      this.orderForm.get('customerId')!.setValue(null);

      this.orderForm.get('guestCustomer')!.get('name')!.setValidators([Validators.required]);
      this.orderForm.get('guestCustomer')!.get('phone')!.setValidators([Validators.required]);
    }

    this.orderForm.get('customerId')!.updateValueAndValidity();
    this.orderForm.get('guestCustomer')!.get('name')!.updateValueAndValidity();
    this.orderForm.get('guestCustomer')!.get('phone')!.updateValueAndValidity();
  }

  loadCustomers(): void {
    this.customersService.getCustomers().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.customers = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo clientes: ${err.error.message}`,
        });
        this.router.navigate(['/sales/orders']);
      },
    });
  }

  onCustomerChange(event: any): void {
    const selectedCustomerId = event.value;

    if (!selectedCustomerId) {
      this.selectedCustomer = null;
      return;
    }

    this.customersService.getCustomer(selectedCustomerId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.selectedCustomer = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo datos del cliente: ${err.error.message}`,
        });
      },
    });
  }
  // -------------------- FIN CATALOGOS ----------------------

  // -------------------- INICIO DESCUENTOS -----------------------
  onDiscountsUpdated(discounts: any[]) {
    this.discounts = discounts;

    this.updateTotals();
  }
  // -------------------- FIN DESCUENTOS -----------------------

  // -------------------- INICIO UTILIDADES ----------------------
  initializeForm(): void {
    this.orderForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      customerId: [null],
      guestCustomer: this.fb.group({
        name: [''],
        phone: [''],
        nit: ['CF'],
        email: [''],
        address: [''],
      }),
      branchId: [''],
      date: [new Date(), [Validators.required]],
      notes: [''],
      status: ['pending', [Validators.required]],
    });

    this.onCustomerTypeChange();

    this.productForm = this.fb.group({
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.001)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      taxPercentage: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.required, Validators.min(0)]],
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }

  onQuantityChanged(detail: any, event: any) {
    this.detailManager.updateQuantity(detail, detail.quantity);
    this.updateTotals();
  }

  onUnitPriceChanged(detail: any, event: any) {
    this.detailManager.updateUnitPrice(detail, detail.unitPrice);
    this.updateTotals();
  }
  // -------------------- FIN UTILIDADES ----------------------

  get details() {
    return this.detailManager.getDetails();
  }

  addProductToDetail(product: Product): void {
    this.detailManager.addProduct(product);
    this.updateTotals();
  }

  removeDetail(index: number) {
    this.detailManager.removeDetail(index);
    this.updateTotals();
  }

  updateTotals() {
    this.totals = this.saleCalculator.calculateTotals(
      this.detailManager.getDetails(),
      this.discounts
    );
  }

  onSaveOrder(): void {
    this.orderForm.markAllAsTouched();

    if (this.selectedCustomerType.value === 'R') {
      const customerId = this.orderForm.get('customerId')?.value;

      if (!customerId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar un cliente registrado.',
        });
        return;
      }

      // this.orderForm.get('guestCustomer')?.setValue(null);
    }

    if (this.selectedCustomerType.value === 'Q') {
      this.orderForm.get('guestCustomer')?.get('name')?.markAsDirty();
      this.orderForm.get('guestCustomer')?.get('phone')?.markAsDirty();

      const guestName = this.orderForm.get('guestCustomer')?.get('name')?.value;
      const guestPhone = this.orderForm.get('guestCustomer')?.get('phone')?.value;

      if (!guestName || !guestPhone) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe completar los datos del cliente.',
        });
        return;
      }

      this.orderForm.get('customerId')?.setValue(null);
    }

    const details = this.detailManager.getDetails();
    if (!details.length) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe agregar productos al pedido.',
      });
      return;
    }

    const payloadDetails = details.map((d) => ({
      productId: d.product.id,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
    }));

    const payload = {
      ...this.orderForm.value,
      details: payloadDetails,
      discounts: this.discounts,
      totals: this.totals,
    };

    if (this.selectedCustomerType.value === 'R') {
      delete payload.guestCustomer;
    } else {
      delete payload.customerId;
    }

    console.log('PAYLOAD FINAL', payload);
    // this.ordersService.createSale(body).subscribe({
    //   next: (res) => {
    //     console.log(res);
    //   },
    //   error: (err) => {
    //     this.messageService.add({
    //       severity: 'error',
    //       summary: 'Error',
    //       detail: `Error al generar el pedido: ${err.error.message}`,
    //     });
    //   },
    // });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
