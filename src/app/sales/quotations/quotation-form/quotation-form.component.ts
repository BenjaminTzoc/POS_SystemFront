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
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';

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
    DrawerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    CurrencyPipe
  ],
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.css']
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
  loadingProducts = false;
  previousBranchId: string | null = null;
  branches: Branch[] = [];
  products: Product[] = [];
  customers: ICustomer[] = [];
  customerType: 'registered' | 'guest' = 'registered';
  correlative = '';

  // Drawer-related state
  drawerVisible = false;
  searchProductQuery = '';

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
    
    // Subscribe to branch selection changes
    this.quotationForm.get('branchId')?.valueChanges.subscribe(branchId => {
      if (branchId) {
        this.loadProducts(branchId);
      } else {
        this.products = [];
      }
    });

    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadQuotation(id);
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
    this.customersService.getCustomers().subscribe(res => this.customers = res.data);

    // Check cash session and roles
    this.cashRegisterService.getStatus().subscribe(res => {
      const user = this.authService.currentUser;
      const isAdmin = user?.roles?.some(r => r.name === 'Administrador' || r.isSuperAdmin);
      
      if (res.data && !isAdmin) {
         this.quotationForm.patchValue({ branchId: res.data.branchId });
         this.quotationForm.get('branchId')?.disable();
         this.previousBranchId = res.data.branchId;
      }
    });
  }

  loadProducts(branchId: string): void {
    this.loadingProducts = true;
    this.productsService.getQuotationCatalog(branchId).subscribe({
      next: (res) => {
        const flatProducts: Product[] = [];
        res.data.forEach((item: any) => {
          flatProducts.push({
            ...item,
            unit: item.unit || {
              name: item.unitName || '',
              abbreviation: item.unitAbbreviation || '',
              allowsDecimals: item.allowsDecimals ?? false
            }
          });
        });
        this.products = flatProducts;
        this.loadingProducts = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos de la sucursal' });
        this.loadingProducts = false;
      }
    });
  }

  onBranchChange(event: any): void {
    const newBranchId = event.value;
    
    if (this.items.length > 0) {
      this.confirmationService.confirm({
        message: 'Si cambia la sucursal, se limpiarán los productos agregados. ¿Desea continuar?',
        header: 'Confirmar cambio de sucursal',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.items.clear();
          this.calculateTotals();
          this.previousBranchId = newBranchId;
        },
        reject: () => {
          this.quotationForm.get('branchId')?.setValue(this.previousBranchId, { emitEvent: false });
        }
      });
    } else {
      this.previousBranchId = newBranchId;
    }
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
        this.previousBranchId = q.branchId;

        this.items.clear();
        q.items.forEach(item => {
          this.items.push(this.fb.group({
            productId: [item.productId, Validators.required],
            quantity: [item.quantity, [Validators.required, Validators.min(1)]],
            unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
            discount: [item.discountType === 'fixed_amount' ? (item.discountAmount || 0) : (item.discount || 0)],
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
    this.items.removeAt(index);
    this.calculateTotals();
  }

  get filteredProducts(): Product[] {
    if (!this.searchProductQuery) return this.products;
    const q = this.searchProductQuery.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  addProductFromDrawer(product: Product) {
    const existingIndex = this.items.controls.findIndex(c => c.get('productId')?.value === product.id);
    if (existingIndex !== -1) {
      const qtyControl = this.items.at(existingIndex).get('quantity');
      qtyControl?.setValue(Number(qtyControl.value || 0) + 1);
      this.messageService.add({ 
        severity: 'info', 
        summary: 'Cantidad Actualizada', 
        detail: `Se incrementó la cantidad de ${product.name}` 
      });
    } else {
      const itemGroup = this.fb.group({
        productId: [product.id, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unitPrice: [Number(product.price), [Validators.required, Validators.min(0)]],
        discount: [0],
        discountType: ['percentage'],
        taxPercentage: [12],
        notes: [''],
        lineTotal: [Number(product.price)]
      });
      this.items.push(itemGroup);
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Producto Añadido', 
        detail: `${product.name} agregado a la lista` 
      });
    }
    this.calculateTotals();
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
    
    // 1. Check general Reactive Form fields (e.g. branchId, validityDays)
    if (this.quotationForm.invalid) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Atención', 
        detail: 'Por favor, completa todos los campos obligatorios del formulario.' 
      });
      return;
    }

    // Explicitly map body values to parse numbers, discounts and quantities correctly
    const body = { 
       ...this.quotationForm.getRawValue(),
       items: this.items.getRawValue().map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          discount: Number(item.discount || 0),
          discountType: item.discountType,
          discountAmount: item.discountType === 'fixed_amount' ? Number(item.discount || 0) : 0,
          taxPercentage: Number(item.taxPercentage || 12),
          notes: item.notes || ''
       })),
       adjustments: this.adjustments.getRawValue().map((adj: any) => ({
          adjustmentType: adj.adjustmentType,
          valueType: adj.valueType,
          value: Number(adj.value || 0),
          reason: adj.reason || ''
       }))
    };

    // 2. Validate client selection / details based on customerType
    if (this.customerType === 'registered') {
       delete body.guestCustomer;
       if (!body.customerId) {
          this.messageService.add({ 
             severity: 'warn', 
             summary: 'Atención', 
             detail: 'Debe seleccionar un cliente registrado para continuar.' 
          });
          return;
       }
    } else {
       delete body.customerId;
       if (!body.guestCustomer?.name || !body.guestCustomer.name.trim()) {
          this.messageService.add({ 
             severity: 'warn', 
             summary: 'Atención', 
             detail: 'Debe ingresar el nombre del cliente invitado.' 
          });
          return;
       }
    }

    // 3. Validate items list (must not be empty)
    if (body.items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debes añadir al menos un producto al detalle de la cotización.'
      });
      return;
    }

    this.loading = true;

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
