//prettier-ignore
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
//prettier-ignore
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { WebsocketService } from '../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrdersService } from '../../services/orders.service';
import { ActivatedRoute, Router } from '@angular/router';
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
import { TooltipModule } from 'primeng/tooltip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TagModule } from 'primeng/tag';
import { ProductSearchComponent } from '../../../components/product-search/product-search.component';
import { SaleDiscountsComponent } from '../../../components/sale-discounts/sale-discounts.component';
import { SaleCalculatorService, SaleTotals } from '../../services/sale-calculator.service';
import { SaleDetailManagerService } from '../../services/sale-detail-manager.service';
import { SaleOrderWsService } from '../../services/sale-order-ws.service';
import { ISaleDetailPayload, ISaleOrderResponse } from '../../interfaces/sale-order.interface';
import { PaymentMethodsService } from '../../services/payment-methods.service';
import { SalePaymentsService } from '../../services/sale-payments.service';
import { SaleStatusPipe } from '../../../shared/pipes/sale-status.pipe';
import { IPaymentMethod, ISalePayment } from '../../interfaces/sale-payment.interface';
import { PaymentStatusPipe } from '../../../shared/pipes/payment-status.pipe';
import { AuthService } from '../../../auth/auth.service';
import { BranchesService } from '../../../inventory/services/branches.service';

@Component({
  selector: 'app-sale-order-form',
  //prettier-ignore
  imports: [ReactiveFormsModule, FormsModule, RadioButtonModule, FloatLabelModule, InputTextModule, CurrencyPipe, ButtonModule, DatePickerModule, TableModule, DialogModule, SelectModule, InputNumberModule, TextareaModule, CommonModule, AutoCompleteModule, ProductSearchComponent, SaleDiscountsComponent, SaleStatusPipe, PaymentStatusPipe, TooltipModule, ConfirmDialogModule, TagModule],
  templateUrl: './sale-order-form.component.html',
  styleUrl: './sale-order-form.component.css',
  providers: [ConfirmationService],
})
export class SaleOrderFormComponent implements OnInit, OnDestroy {
  private saleCalculator = inject(SaleCalculatorService);
  private detailManager = inject(SaleDetailManagerService);
  private ordersService = inject(OrdersService);
  private customersService = inject(CustomersService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private salePaymentsService = inject(SalePaymentsService);
  private saleOrderWs = inject(SaleOrderWsService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);
  private destroy$ = new Subject<void>();

  selectedCustomerType: any = null;
  customerTypes: any[] = [
    { name: 'Cliente Registrado', value: 'R' }, //REGISTERED CUSTOMER
    { name: 'Encargo Rápido', value: 'Q' }, //QUICK ORDER
  ];
  customers: ICustomer[] = [];
  selectedCustomer: ICustomer | null = null;
  previousBranchId: string | null = null;
  branches: any[] = [];
  isSuperAdmin: boolean = false;

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
  paymentForm!: FormGroup;

  isEditing: boolean = false;
  saleId: string | null = null;
  sale: ISaleOrderResponse | null = null;
  showDiscountDialog: boolean = false;

  applyTax: boolean = true;

  payments: any[] = [];
  isAddingPayment: boolean = false;
  paymentMethods: IPaymentMethod[] = [];

  hasUnsavedChanges: boolean = false;
  private initialDetails: ISaleDetailPayload[] = [];
  private initialFormValues: any = {};
  private initialDiscounts: any[] = [];
  private initialApplyTax: boolean = true;

  get isCreateMode(): boolean {
    return !this.isEditing;
  }

  get isEditMode(): boolean {
    return this.isEditing;
  }

  ngOnInit(): void {
    this.detailManager.clear();
    this.initializeForm();

    this.route.queryParams.subscribe((params) => {
      this.saleId = params['id'] ?? null;
      this.isEditing = !!this.saleId;

      // Cargamos catálogos necesarios para ambos modos
      this.loadCustomers();
      this.loadBranches();

      if (this.isEditing) {
        this.loadSale(this.saleId!);
      } else {
        this.initializeForNewOrder();
      }
    });
  }

  private initializeForNewOrder() {
    this.selectedCustomerType = this.customerTypes[0];
    this.setupWebSocketListeners();
    this.loadNextInvoiceNumber();
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches = res.data;
          this.checkUserRole();
        }
      },
      error: (err) => {
        console.error('Error loading branches', err);
      },
    });
  }

  onBranchChange(event: any): void {
    const newBranchId = event.value;

    if (this.details.length > 0) {
      this.confirmationService.confirm({
        message: 'Al cambiar de sucursal se eliminarán los productos agregados. ¿Desea continuar?',
        header: 'Confirmación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar y limpiar',
        rejectLabel: 'No, mantener',
        accept: () => {
          this.detailManager.clear();
          this.updateTotals();
          this.previousBranchId = newBranchId;
        },
        reject: () => {
          this.orderForm.get('branchId')?.setValue(this.previousBranchId, { emitEvent: false });
        },
      });
    } else {
      this.previousBranchId = newBranchId;
    }
  }

  checkUserRole() {
    this.isSuperAdmin = this.authService.hasPermission('products.manage_global_stock');
    const user: any = this.authService.currentUser;

    if (user?.roles?.some((r: any) => r.isSuperAdmin)) {
      this.isSuperAdmin = true;
    }

    if (this.isSuperAdmin && this.branches.length > 0 && !this.isEditing) {
      this.orderForm.get('branchId')?.setValue(this.branches[0].id);
      this.previousBranchId = this.branches[0].id;
    }

    if (!this.isSuperAdmin && !this.isEditing) {
      let userBranchId: string | undefined;
      if (user.branchId) {
        userBranchId = user.branchId;
      } else if (user.branch?.id) {
        userBranchId = user.branch.id;
      }

      if (userBranchId && this.orderForm) {
        this.orderForm.get('branchId')?.setValue(userBranchId);
        this.orderForm.get('branchId')?.disable();
      }
    }
  }

  loadSale(id: string) {
    this.ordersService.getSale(id).subscribe({
      next: (res) => {
        console.log(res);
        this.orderForm.patchValue({
          branchId: res.data.branch?.id,
          invoiceNumber: res.data.invoiceNumber,
          customerId: res.data.customer?.id || null,
          guestCustomer: res.data.guestCustomer,
          date: res.data.date ? new Date(res.data.date) : null,
          dueDate: res.data.dueDate ? new Date(res.data.dueDate) : null,
          notes: res.data.notes,
          status: res.data.status,
        });
        this.orderForm.get('branchId')?.disable();
        this.selectedCustomer = res.data.customer ?? null;

        if (res.data.customer) {
          this.selectedCustomerType = this.customerTypes.find((t) => t.value === 'R');
        } else {
          this.selectedCustomerType = this.customerTypes.find((t) => t.value === 'Q');
        }

        this.onCustomerTypeChange();

        const details: ISaleDetailPayload[] = [];
        res.data.details?.map((detail) => {
          details.push({
            product: detail.product,
            quantity: Number(detail.quantity),
            unitPrice: Number(detail.unitPrice),
            lineTotal: Number(detail.lineTotal),
          });
        });

        this.initialDetails = JSON.parse(JSON.stringify(details));
        this.detailManager.setDetails(details);

        if (res.data.discounts) {
          console.log(res.data.discounts);
          this.discounts = res.data.discounts.map((d) => ({
            type: d.type,
            value: d.value,
            reason: d.reason,
          }));
        }
        this.initialDiscounts = JSON.parse(JSON.stringify(this.discounts));
        this.applyTax = res.data.applyTax!;
        this.initialApplyTax = this.applyTax;

        if (res.data.payments && res.data.payments.length > 0) {
          this.payments = res.data.payments.map((payment: ISalePayment) => ({
            id: payment.id,
            paymentProcessor: payment.paymentProcessor,
            externalTransactionId: payment.externalTransactionId,
            paymentLinkId: payment.paymentLinkId,
            amount: Number(payment.amount),
            date: new Date(payment.date),
            referenceNumber: payment.referenceNumber,
            bankAccount: payment.bankAccount,
            status: payment.status,
            notes: payment.notes,
            paymentMethod: {
              id: payment.paymentMethod?.id || '',
              name: payment.paymentMethod?.name || 'No especificado',
              code: payment.paymentMethod?.code || '',
              description: payment.paymentMethod?.description || '',
              requiresBankAccount: payment.paymentMethod?.requiresBankAccount || false,
              isActive: payment.paymentMethod?.isActive || false,
              createdAt: payment.paymentMethod?.createdAt
                ? new Date(payment.paymentMethod.createdAt)
                : new Date(),
              updatedAt: payment.paymentMethod?.updatedAt
                ? new Date(payment.paymentMethod.updatedAt)
                : new Date(),
            },
            createdAt: new Date(payment.createdAt),
            updatedAt: new Date(payment.updatedAt),
          }));
        } else {
          this.payments = [];
        }
        this.updateTotals();
        this.initialFormValues = this.orderForm.getRawValue();
        this.sale = res.data;

        if (this.sale.status !== 'pending') {
          this.orderForm.disable();
        } else {
          this.orderForm.enable();
          // branchId might need special handling if not SuperAdmin
          this.checkUserRole();
        }

        // Siempre bloqueamos la sucursal en modo edición
        this.orderForm.get('branchId')?.disable();

        this.hasUnsavedChanges = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error generando número de orden: ${err.error.message}`,
        });
        this.router.navigate(['/sales/orders']);
      },
    });
  }

  private checkForChanges(): void {
    if (!this.isEditing) return;

    const currentDetails = this.detailManager.getDetails();
    const currentFormValues = this.orderForm.getRawValue();

    const detailsChanged = !this.areDetailsEqual(this.initialDetails, currentDetails);
    const formChanged =
      JSON.stringify(this.initialFormValues) !== JSON.stringify(currentFormValues);
    const discountsChanged =
      JSON.stringify(this.initialDiscounts) !== JSON.stringify(this.discounts);
    const taxChanged = this.initialApplyTax !== this.applyTax;

    this.hasUnsavedChanges = detailsChanged || formChanged || discountsChanged || taxChanged;
  }

  private areDetailsEqual(details1: ISaleDetailPayload[], details2: ISaleDetailPayload[]): boolean {
    if (details1.length !== details2.length) return false;

    return details1.every((detail1, index) => {
      const detail2 = details2[index];
      return (
        detail1.product.id === detail2.product.id &&
        detail1.quantity === detail2.quantity &&
        detail1.unitPrice === detail2.unitPrice
      );
    });
  }

  markAsChanged(): void {
    this.hasUnsavedChanges = true;
    this.checkForChanges();
  }

  // -------------------- INICIO WEBSOCKET NUMERO ORDEN ---------------------
  setupWebSocketListeners(): void {
    this.saleOrderWs.newSaleCreated$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.messageService.add({
        severity: 'info',
        summary: 'Nueva orden creada',
        detail: `Otro usuario creó la orden: ${data.data.invoiceNumber}`,
        life: 5000,
      });

      this.loadNextInvoiceNumber();
    });

    this.saleOrderWs.nextInvoiceNumberUpdated$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
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
    this.markAsChanged();
  }
  // -------------------- FIN DESCUENTOS -----------------------

  // -------------------- INICIO PAGOS -----------------------
  get showPaymentSection(): boolean {
    return !!(this.isEditMode && this.sale?.status !== 'pending');
  }

  get canRegisterPayments(): boolean {
    const validStatuses = ['confirmed', 'delivered'];
    const status = this.sale?.status || '';
    return !!(this.isEditMode && validStatuses.includes(status) && this.hasPendingBalance);
  }

  get hasPendingBalance(): boolean {
    if (!this.sale) return false;
    return Number(this.sale.pendingAmount) > 0;
  }

  cancelPayment() {
    this.paymentForm.patchValue({
      paymentMethodId: this.paymentMethods[0].id,
      amount: 0,
      date: new Date(),
      notes: '',
    });
    this.isAddingPayment = false;
  }

  registerPayment() {
    if (this.paymentForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Complete todos los campos obligatorios',
      });
      return;
    }

    const formValue = this.paymentForm.value;

    const paymentPayload: any = {
      saleId: this.saleId,
      paymentMethodId: formValue.paymentMethodId,
      amount: Number(formValue.amount),
      date: formValue.date.toISOString().split('T')[0],
      notes: formValue.notes || undefined,
    };

    this.salePaymentsService.createSalePayment(paymentPayload).subscribe({
      next: (res) => {
        if (res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Pago registrado correctamente',
          });

          this.loadSale(this.saleId!);

          this.paymentForm.reset({
            paymentMethodId: '',
            amount: 0,
            date: new Date(),
            notes: '',
          });
          this.isAddingPayment = false;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al registrar el pago: ${err.error.message}`,
        });
      },
    });
  }

  addPayment() {
    this.isAddingPayment = true;
    this.paymentMethodsService.getPaymentMethods().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.paymentMethods = res.data.map((method: IPaymentMethod) => ({
            id: method.id,
            name: method.name,
            code: method.code,
            description: method.description,
            requiresBankAccount: method.requiresBankAccount,
            isActive: method.isActive,
            createdAt: new Date(method.createdAt) ?? null,
            updatedAt: new Date(method.updatedAt) ?? null,
          }));
          this.paymentForm.get('paymentMethodId')?.setValue(this.paymentMethods[0].id);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al obtener metodos de pago: ${err.error.message}`,
        });
        this.isAddingPayment = false;
      },
    });
  }
  // -------------------- FIN PAGOS -----------------------

  // -------------------- INICIO UTILIDADES ----------------------
  initializeForm(): void {
    this.orderForm = this.fb.group({
      branchId: ['', Validators.required],
      invoiceNumber: ['', Validators.required],
      customerId: [null],
      guestCustomer: this.fb.group({
        name: [''],
        phone: [''],
        nit: ['CF'],
        email: [''],
        address: [''],
      }),
      date: [new Date(), [Validators.required]],
      dueDate: [],
      notes: [''],
      status: ['pending', [Validators.required]],
    });

    this.onCustomerTypeChange();

    this.paymentForm = this.fb.group({
      paymentMethodId: ['', Validators.required],
      amount: [0, Validators.required],
      date: [new Date(), Validators.required],
      notes: [''],
    });

    this.orderForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.checkForChanges();
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;

    return `${environment.baseUrl}${imageUrl}`;
  }

  onQuantityChanged(detail: any, event: any) {
    console.log(detail.product);
    this.detailManager.updateQuantity(detail, detail.quantity);
    this.updateTotals();
    this.markAsChanged();
  }

  onUnitPriceChanged(detail: any, event: any) {
    this.detailManager.updateUnitPrice(detail, detail.unitPrice);
    this.updateTotals();
    this.markAsChanged();
  }

  toggleTax() {
    this.applyTax = !this.applyTax;
    this.updateTotals();
    this.markAsChanged();
  }
  // -------------------- FIN UTILIDADES ----------------------

  get details() {
    return this.detailManager.getDetails();
  }

  get usedProductIds(): string[] {
    return this.details.map((d) => d.product.id);
  }

  addProductToDetail(product: Product): void {
    console.log(product);
    this.detailManager.addProduct(product);
    this.updateTotals();
    this.markAsChanged();
  }

  removeDetail(index: number) {
    this.detailManager.removeDetail(index);
    this.updateTotals();
    this.markAsChanged();
  }

  updateTotals() {
    this.totals = this.saleCalculator.calculateTotals(
      this.detailManager.getDetails(),
      this.discounts,
      this.applyTax
    );
  }

  private getCleanPayload() {
    const details = this.detailManager.getDetails();
    const payloadDetails = details.map((d) => ({
      productId: d.product.id,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
    }));

    const payload = {
      ...this.orderForm.getRawValue(),
      details: payloadDetails,
      discounts: JSON.parse(JSON.stringify(this.discounts)),
      applyTax: this.applyTax,
    };

    // Determinar tipo de cliente (puede ser objeto o string según selección)
    const typeValue =
      typeof this.selectedCustomerType === 'object'
        ? this.selectedCustomerType?.value
        : this.selectedCustomerType;

    console.log('CLEANING PAYLOAD - Type detected:', typeValue);

    if (typeValue === 'R') {
      console.log('Removing guestCustomer from payload');
      delete payload.guestCustomer;
    } else {
      console.log('Removing customerId from payload');
      delete payload.customerId;
    }

    // El status nunca debe enviarse en la creación/edición general
    delete payload.status;

    console.log('FINAL PAYLOAD TO SEND:', payload);
    return payload;
  }

  onSaveOrder(): void {
    this.orderForm.markAllAsTouched();

    const typeValue =
      typeof this.selectedCustomerType === 'object'
        ? this.selectedCustomerType?.value
        : this.selectedCustomerType;

    if (typeValue === 'R') {
      const customerId = this.orderForm.get('customerId')?.value;
      if (!customerId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Debe seleccionar un cliente registrado.',
        });
        return;
      }
    }

    if (typeValue === 'Q') {
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

    const payload = this.getCleanPayload();

    if (!payload.details.length) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debe agregar productos al pedido.',
      });
      return;
    }

    this.ordersService.createSale(payload).subscribe({
      next: (res) => {
        if (res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `La orden se ha generado correctamente.`,
          });
          this.isEditing = true;
          this.saleId = res.data.id;
          this.loadSale(this.saleId);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al generar el pedido: ${err.error.message}`,
        });
        this.isEditing = false;
      },
    });
  }

  onSaveChanges(): void {
    if (this.orderForm.invalid) {
      console.log('FORM INVALID. Current values:', this.orderForm.value);
      Object.keys(this.orderForm.controls).forEach((key) => {
        const control = this.orderForm.get(key);
        if (control?.invalid) {
          console.log(`❌ Invalid Field: ${key}`, control.errors);
        }
      });

      // Special check for guestCustomer group
      const guestGroup = this.orderForm.get('guestCustomer') as FormGroup;
      if (guestGroup.invalid) {
        Object.keys(guestGroup.controls).forEach((key) => {
          const control = guestGroup.get(key);
          if (control?.invalid) {
            console.log(`❌ Invalid Guest Field: ${key}`, control.errors);
          }
        });
      }

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor corregir los errores en el formulario.',
      });
      return;
    }

    const payload = this.getCleanPayload();
    console.log('ENVIANDO CAMBIOS', payload);

    this.ordersService.updateSale(this.saleId!, payload).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Cambios guardados correctamente.',
          });
          this.loadSale(this.saleId!);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error al guardar cambios: ${err.error.message}`,
        });
      },
    });
  }

  resetChanges(): void {
    if (this.saleId) {
      this.loadSale(this.saleId);
    }
  }

  onConfirmSale(): void {
    if (this.hasUnsavedChanges) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cambios sin guardar',
        detail: 'Debe guardar los cambios antes de confirmar la venta.',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Confirmar Venta',
      message:
        '¿Está seguro de confirmar esta venta? Una vez confirmada, los productos, cantidades y precios no podrán ser modificados.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ordersService.confirmSale(this.sale!.id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Venta confirmada correctamente.',
            });
            this.loadSale(res.data.id);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al confirmar el pedido: ${err.error.message}`,
            });
          },
        });
      },
    });
  }

  onDeliverSale(): void {
    this.confirmationService.confirm({
      header: 'Entregar Venta',
      message: '¿Confirma que la venta ha sido entregada al cliente?',
      icon: 'pi pi-check-circle',
      acceptLabel: 'Sí, entregar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.ordersService.deliverSale(this.sale!.id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Venta marcada como entregada.',
            });
            this.loadSale(res.data.id);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al entregar: ${err.error.message}`,
            });
          },
        });
      },
    });
  }

  onCancelSale(): void {
    this.confirmationService.confirm({
      header: 'Cancelar Venta',
      message: '¿Está seguro que desea cancelar esta venta? Esta acción no se puede deshacer.',
      icon: 'pi pi-times-circle',
      acceptLabel: 'Sí, cancelar venta',
      rejectLabel: 'Cerrar',
      accept: () => {
        this.ordersService.cancelSale(this.sale!.id).subscribe({
          next: (res) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Venta cancelada correctamente.',
            });
            this.loadSale(res.data.id);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al cancelar: ${err.error.message}`,
            });
          },
        });
      },
    });
  }

  getStatusSeverity(
    status: string
  ): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'pending':
        return 'warn';
      case 'confirmed':
        return 'success';
      case 'preparing':
        return 'info';
      case 'delivered':
        return 'secondary';
      case 'cancelled':
        return 'danger';
      case 'on_hold':
        return 'contrast';
      default:
        return 'info';
    }
  }

  onBack(): void {
    this.router.navigate(['/sales/orders']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
