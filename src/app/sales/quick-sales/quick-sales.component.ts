import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

// Services
import { OrdersService } from '../services/orders.service';
import { ProductsService } from '../../inventory/services/products.service';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { SaleOrderWsService } from '../services/sale-order-ws.service';
import { AuthService } from '../../auth/auth.service';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { SaleCalculatorService } from '../services/sale-calculator.service';

// Components
import { SaleDiscountsComponent } from '../../components/sale-discounts/sale-discounts.component';

// Interfaces
import { Product } from '../../inventory/interfaces/product.interface';
import { environment } from '../../../environments/environment';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-quick-sale',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    SelectModule,
    TagModule,
    CardModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TextareaModule,
    SkeletonModule,
    ToggleSwitchModule,
    SaleDiscountsComponent,
    CurrencyPipe
  ],
  templateUrl: './quick-sale.component.html',
  styleUrl: './quick-sale.component.scss'
})
export class QuickSaleComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ordersService = inject(OrdersService);
  private productsService = inject(ProductsService);
  private paymentService = inject(PaymentMethodsService);
  private saleWsService = inject(SaleOrderWsService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private cashService = inject(CashRegisterService);
  private saleCalculator = inject(SaleCalculatorService);
  private router = inject(Router);

  // Signals for reactivity
  products = signal<Product[]>([]);
  searchTerm = signal<string>('');
  paymentMethods = signal<any[]>([]);
  saving = signal(false);
  loadingProducts = signal(false);
  applyTax = signal(true);
  discounts = signal<any[]>([]);
  showDiscountDialog = signal(false);
  
  // WebSocket next invoice
  nextInvoiceNumber = toSignal(this.saleWsService.nextInvoiceNumberUpdated$);
  
  // Computed products for the ribbon
  filteredProducts = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.sku?.toLowerCase().includes(term) || 
      p.barcode?.toLowerCase().includes(term)
    );
  });

  // Form for the quick sale
  saleForm: FormGroup;

  constructor() {
    this.saleForm = this.fb.group({
      details: this.fb.array([], [Validators.required]),
      payments: this.fb.array([], [Validators.required]),
      notes: [''],
    });
  }

  get details(): FormArray {
    return this.saleForm.get('details') as FormArray;
  }

  get payments(): FormArray {
    return this.saleForm.get('payments') as FormArray;
  }

  // Use a signal to track form values for totals
  formValues = signal<any>(null);

  // Computed totals based on formValues signal
  salesTotals = computed(() => {
    const val = this.formValues();
    if (!val || !val.details) return null;
    
    return this.saleCalculator.calculateTotals(
      val.details,
      this.discounts(),
      this.applyTax()
    );
  });

  totalAmount = computed(() => this.salesTotals()?.subtotal || 0);
  taxAmount = computed(() => this.salesTotals()?.taxTotal || 0);
  discountTotal = computed(() => this.salesTotals()?.discountTotal || 0);
  grandTotal = computed(() => this.salesTotals()?.total || 0);

  totalPaid = computed(() => {
    const val = this.formValues();
    if (!val || !val.payments) return 0;
    return val.payments.reduce((acc: number, current: any) => {
      return acc + (current.amount || 0);
    }, 0);
  });

  remainingAmount = computed(() => {
    return Number((this.grandTotal() - this.totalPaid()).toFixed(2));
  });

  ngOnInit(): void {
    // Asegurarnos de tener el estado de la caja antes de cargar productos
    this.cashService.getStatus().subscribe({
      next: () => this.loadProducts(),
      error: () => this.loadProducts() // Intentar de todos modos con los datos del usuario
    });
    this.loadPaymentMethods();
    this.addDefaultPayment();

    // Sync form to signal for reactive totals
    this.saleForm.valueChanges.subscribe(val => {
      this.formValues.set(val);
    });
    
    // Set initial value
    this.formValues.set(this.saleForm.value);
  }

  loadProducts(): void {
    const session = this.cashService.currentSession();
    const user: any = this.authService.currentUser;
    
    const branchId = session?.branchId || user?.branchId || user?.branch?.id;

    if (!branchId) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'No se pudo determinar su sucursal. Cargando catálogo general.' 
      });
      this.productsService.getProducts().subscribe({
        next: (res) => {
          this.products.set(res.data.filter(p => !p.isVariant));
          this.loadingProducts.set(false);
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos' });
          this.loadingProducts.set(false);
        }
      });
      return;
    }

    this.loadingProducts.set(true);
    this.productsService.getBranchCatalog(branchId).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el catálogo de la sucursal' });
        this.loadingProducts.set(false);
      }
    });
  }

  loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe({
      next: (res) => {
        this.paymentMethods.set(res.data);
        if (res.data.length > 0 && this.payments.length > 0) {
          const cashMethod = res.data.find((m: any) => m.name.toLowerCase().includes('efectivo'));
          if (cashMethod) {
            this.payments.at(0).get('paymentMethodId')?.setValue(cashMethod.id);
          } else {
            this.payments.at(0).get('paymentMethodId')?.setValue(res.data[0].id);
          }
        }
      }
    });
  }

  addDefaultPayment(): void {
    const paymentGroup = this.fb.group({
      paymentMethodId: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0]],
      referenceNumber: ['']
    });
    this.payments.push(paymentGroup);
  }

  addProduct(product: Product): void {
    if (!product) return;

    const existingIndex = this.details.controls.findIndex(c => c.get('productId')?.value === product.id);

    if (existingIndex >= 0) {
      const quantityControl = this.details.at(existingIndex).get('quantity');
      quantityControl?.setValue(quantityControl.value + 1);
    } else {
      const detailGroup = this.fb.group({
        productId: [product.id, Validators.required],
        productName: [product.name],
        sku: [product.sku],
        quantity: [1, [Validators.required, Validators.min(0.001)]],
        unitPrice: [product.price || 0, [Validators.required, Validators.min(0)]],
        discount: [0],
        discountType: ['percentage'],
        discountAmount: [0],
        allowsDecimals: [product.unit?.allowsDecimals ?? (product as any).allowsDecimals ?? false],
        unitAbbreviation: [product.unit?.abbreviation || (product as any).unitAbbreviation || '']
      });
      this.details.push(detailGroup);
    }

    this.updatePaymentAmount();
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
    this.updatePaymentAmount();
  }

  updatePaymentAmount(): void {
    if (this.payments.length === 1) {
      setTimeout(() => {
         this.payments.at(0).get('amount')?.setValue(this.grandTotal());
      });
    }
  }

  onDiscountsUpdated(discounts: any[]): void {
    this.discounts.set(discounts);
    this.updatePaymentAmount();
  }

  onSave(): void {
    if (this.saleForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor complete todos los campos requeridos' });
      return;
    }

    if (this.totalPaid() < this.grandTotal()) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'El monto pagado es menor al total' });
      return;
    }

    this.saving.set(true);

    const session = this.cashService.currentSession();
    const user: any = this.authService.currentUser;
    const branchId = session?.branchId || user?.branchId || user?.branch?.id;

    const formValue = this.saleForm.value;
    const payload = {
      branchId: branchId,
      details: formValue.details.map((d: any) => ({
        productId: d.productId,
        quantity: Number(d.quantity),
        unitPrice: Number(d.unitPrice),
        discount: Number(d.discount || 0),
        discountType: d.discountType,
        discountAmount: Number(d.discountAmount || 0)
      })),
      payments: formValue.payments.map((p: any) => ({
        paymentMethodId: p.paymentMethodId,
        amount: Number(p.amount),
        date: p.date,
        referenceNumber: p.referenceNumber || null
      })),
      discounts: this.discounts(),
      notes: formValue.notes,
      applyTax: this.applyTax()
    };

    this.ordersService.quickSale(payload).subscribe({
      next: (res: any) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Venta realizada: ${res.data.invoiceNumber}` });
        this.resetForm();
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Error al procesar la venta' 
        });
        this.saving.set(false);
      },
      complete: () => {
        this.saving.set(false);
      }
    });
  }

  resetForm(): void {
    this.details.clear();
    this.payments.clear();
    this.saleForm.patchValue({ notes: '' });
    this.discounts.set([]);
    this.addDefaultPayment();
    this.loadPaymentMethods();
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  onCancel(): void {
    this.router.navigate(['/sales/orders']);
  }
}
