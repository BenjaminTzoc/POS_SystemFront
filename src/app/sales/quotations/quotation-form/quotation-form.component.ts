import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule, CurrencyPipe } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Services & Interfaces
import { QuotationsService } from '../../services/quotations.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { CustomersService } from '../../services/customers.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { Product } from '../../../inventory/interfaces/product.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { CreateQuotationDto, IQuotation } from '../../interfaces/quotation.interface';
import { SaleCalculatorService } from '../../services/sale-calculator.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/auth.service';
import { CashRegisterService } from '../../../inventory/services/cash-register.service';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    InputNumberModule,
    ToggleSwitchModule,
    TableModule,
    TextareaModule,
    ConfirmDialogModule,
    CurrencyPipe
  ],
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class QuotationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private quotationsService = inject(QuotationsService);
  private branchesService = inject(BranchesService);
  private productsService = inject(ProductsService);
  private customersService = inject(CustomersService);
  private saleCalculator = inject(SaleCalculatorService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private cashRegisterService = inject(CashRegisterService);

  quotationForm: FormGroup;
  isEditMode = false;
  loading = false;
  branches: Branch[] = [];
  products: Product[] = [];
  customers: ICustomer[] = [];
  customerType: 'registered' | 'guest' = 'registered';
  correlative = '';

  total = 0;
  subtotal = 0;
  tax = 0;

  constructor() {
    this.quotationForm = this.fb.group({
      branchId: [null, Validators.required],
      customerId: [null],
      validityDays: [15, [Validators.required, Validators.min(1)]],
      applyTax: [true],
      notes: [''],
      items: this.fb.array([]),
      adjustments: this.fb.array([]),
      guestCustomer: this.fb.group({
        name: [''],
        nit: [''],
        email: [''],
        phone: ['']
      })
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadQuotation(id);
    } else {
      this.addItem();
    }
  }

  get items() {
    return this.quotationForm.get('items') as FormArray;
  }

  get adjustments() {
    return this.quotationForm.get('adjustments') as FormArray;
  }

  loadInitialData(): void {
    this.branchesService.getBranches().subscribe(res => this.branches = res.data);
    this.productsService.getProducts().subscribe(res => {
      this.products = res.data;
    });
    this.customersService.getCustomers().subscribe(res => this.customers = res.data);

    // Check cash session and roles
    this.cashRegisterService.getStatus().subscribe(res => {
      const user = this.authService.currentUser;
      const isAdmin = user?.roles?.some(r => r.name === 'Administrador' || r.isSuperAdmin);
      
      if (res.data && !isAdmin) {
         this.quotationForm.patchValue({ branchId: res.data.branchId });
         this.quotationForm.get('branchId')?.disable();
      }
    });
  }

  getProductById(id: string) {
    return this.products.find((p) => p.id === id);
  }

  loadQuotation(id: string) {
    this.loading = true;
    this.quotationsService.getQuotationById(id).subscribe({
      next: (res) => {
        const q = res.data;
        this.correlative = q.correlative;
        if (q.guestCustomer) this.customerType = 'guest';
        
        this.quotationForm.patchValue({
          branchId: q.branchId,
          customerId: q.customerId,
          validityDays: 15,
          applyTax: q.applyTax ?? true,
          notes: q.notes,
          guestCustomer: q.guestCustomer || {}
        });

        this.items.clear();
        q.items.forEach(item => {
          this.items.push(this.fb.group({
            productId: [item.productId, Validators.required],
            quantity: [item.quantity, [Validators.required, Validators.min(1)]],
            unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
            discount: [item.discount || 0],
            discountType: [item.discountType || 'percentage'],
            taxPercentage: [item.taxPercentage || 12],
            notes: [item.notes || ''],
            lineTotal: [item.subtotal || 0]
          }));
        });

        this.adjustments.clear();
        if (q.adjustments) {
          q.adjustments.forEach(adj => {
            this.adjustments.push(this.fb.group({
              adjustmentType: [adj.adjustmentType, Validators.required],
              valueType: [adj.valueType, Validators.required],
              value: [adj.value, [Validators.required, Validators.min(0)]],
              reason: [adj.reason, Validators.required]
            }));
          });
        }
        this.calculateTotals();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la cotización' });
        this.loading = false;
      }
    });
  }

  addItem() {
    const itemGroup = this.fb.group({
      productId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0],
      discountType: ['percentage'],
      taxPercentage: [12],
      notes: [''],
      lineTotal: [0]
    });

    itemGroup.get('productId')?.valueChanges.subscribe(id => {
      const prod = this.products.find(p => p.id === id);
      if (prod) {
        itemGroup.patchValue({ unitPrice: Number(prod.price) }, { emitEvent: false });
        this.calculateTotals();
      }
    });

    this.items.push(itemGroup);
  }

  addAdjustment() {
    const adjustmentGroup = this.fb.group({
      adjustmentType: ['discount', Validators.required],
      valueType: ['fixed_amount', Validators.required],
      value: [0, [Validators.required, Validators.min(0)]],
      reason: ['', Validators.required]
    });
    this.adjustments.push(adjustmentGroup);
  }

  removeAdjustment(index: number) {
    this.adjustments.removeAt(index);
    this.calculateTotals();
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
      this.calculateTotals();
    }
  }

  calculateTotals() {
    const applyTax = this.quotationForm.get('applyTax')?.value;
    const itemsData = this.items.value;

    let subtotal = 0;

    this.items.controls.forEach((group, index) => {
      const item = itemsData[index];
      const unitPrice = Number(item.unitPrice || 0);
      const qty = Number(item.quantity || 0);
      const disc = Number(item.discount || 0);
      
      const lineNetAmount = unitPrice * qty;
      let lineDiscount = 0;
      
      if (item.discountType === 'percentage') {
        lineDiscount = lineNetAmount * (disc / 100);
      } else {
        lineDiscount = disc;
      }

      const lineTotal = lineNetAmount - lineDiscount;
      group.get('lineTotal')?.setValue(lineTotal, { emitEvent: false });
      subtotal += lineTotal;
    });

    this.subtotal = subtotal;

    let adjustmentsTotal = 0;
    this.adjustments.value.forEach((adj: any) => {
      const val = Number(adj.value || 0);
      let impact = 0;
      if (adj.valueType === 'percentage') {
        impact = subtotal * (val / 100);
      } else {
        impact = val;
      }
      adjustmentsTotal += (adj.adjustmentType === 'discount' ? -impact : impact);
    });

    const netAmount = subtotal + adjustmentsTotal;
    this.tax = applyTax ? netAmount * 0.12 : 0;
    this.total = netAmount + this.tax;
  }

  onSave() {
    this.quotationForm.markAllAsTouched();
    if (this.quotationForm.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Por favor, completa todos los campos requeridos' });
      return;
    }

    this.loading = true;
    const body = { ...this.quotationForm.value };
    
    if (this.customerType === 'registered') {
       delete body.guestCustomer;
       if (!body.customerId) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe seleccionar un cliente registrado' });
          this.loading = false;
          return;
       }
    } else {
       delete body.customerId;
       if (!body.guestCustomer?.name) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Debe ingresar al nombre del invitado' });
          this.loading = false;
          return;
       }
    }

    const request = this.isEditMode 
      ? this.quotationsService.updateQuotation(this.route.snapshot.params['id'], body)
      : this.quotationsService.createQuotation(body);

    request.subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Cotización ${this.isEditMode ? 'actualizada' : 'creada'}` });
        this.router.navigate(['/sales/quotations']);
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error.message || 'Error en la operación' });
        this.loading = false;
      },
      complete: () => this.loading = false
    });
  }

  onCancel() {
    this.router.navigate(['/sales/quotations']);
  }

  asGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  getCustomerById(id: string): ICustomer | undefined {
    return this.customers.find(c => c.id === id);
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
