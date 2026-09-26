import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { BranchSelectComponent } from '../../../shared/components/branch-select/branch-select.component';
import { CustomerSelectComponent } from '../../../shared/components/customer-select/customer-select.component';
import { ProductRibbonComponent } from '../../../shared/components/product-ribbon/product-ribbon.component';
import { ProductsTableComponent, QuotationItem } from '../../../shared/components/products-table/products-table.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { BranchesService } from '../../../inventory/services/branches.service';
import { CustomersService } from '../../services/customers.service';
import { CustomerAppliedPricesService } from '../../services/customer-applied-prices.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { QuotationsService } from '../../services/quotations.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { Product } from '../../../inventory/interfaces/product.interface';
import { CreateQuotationDto } from '../../interfaces/quotation.interface';
import { environment } from '../../../../environments/environment';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';

export type { QuotationItem };

@Component({
  selector: 'app-quotation-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    PageHeaderComponent,
    BranchSelectComponent,
    CustomerSelectComponent,
    ProductRibbonComponent,
    ProductsTableComponent,
    ConfirmationModalComponent,
    ButtonModule,
    TooltipModule,
    SelectModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputGroupModule,
    InputGroupAddonModule,
    ToggleSwitchModule,
    TextareaModule
  ],
  templateUrl: './quotation-edit.component.html',
  styleUrl: './quotation-edit.component.css'
})
export class QuotationEditComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branchesService = inject(BranchesService);
  private customersService = inject(CustomersService);
  private appliedPrices = inject(CustomerAppliedPricesService);
  private productsService = inject(ProductsService);
  private quotationsService = inject(QuotationsService);
  private messageService = inject(MessageService);

  isEditMode = false;
  correlative = '';
  branches: Branch[] = [];
  customers: ICustomer[] = [];
  products: Product[] = [];
  loadingBranches = false;
  loadingCustomers = false;
  loadingProducts = false;
  selectedBranchId: string | null = null;
  previousBranchId: string | null = null;
  selectedCustomerId: string | null = null;
  customerType: 'registered' | 'guest' = 'registered';

  guestCustomer = {
    name: '',
    nit: '',
    email: '',
    phone: ''
  };

  // Configuración & Totales
  applyTax = true;
  validityDays = 15;
  notes = '';
  saving = false;

  // Modales de confirmación
  showCancelConfirmModal = false;
  showBranchChangeConfirmModal = false;
  pendingBranchId: string | null = null;

  items: QuotationItem[] = [];

  getItemDiscountAmount(item: QuotationItem): number {
    const gross = (item.quantity || 0) * (item.price || 0);
    const disc = item.discount || 0;
    if (item.discountType === 'percentage') {
      return (gross * disc) / 100;
    }
    return disc;
  }

  getItemSubtotal(item: QuotationItem): number {
    const gross = (item.quantity || 0) * (item.price || 0);
    const discAmount = this.getItemDiscountAmount(item);
    return Math.max(0, gross - discAmount);
  }

  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + this.getItemSubtotal(i), 0);
  }

  get tax(): number {
    if (!this.applyTax) return 0;
    return this.subtotal * 0.12;
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  get isFormValid(): boolean {
    if (!this.selectedBranchId) return false;
    if (this.customerType === 'registered' && !this.selectedCustomerId) return false;
    if (this.customerType === 'guest' && !this.guestCustomer.name.trim()) return false;
    if (!this.validityDays || this.validityDays < 1) return false;
    if (this.items.length === 0) return false;
    return true;
  }

  ngOnInit(): void {
    this.appliedPrices.clear();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.loadQuotation(id);
    }
    this.loadBranches();
    this.loadCustomers();
  }

  loadBranches(): void {
    this.loadingBranches = true;
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        this.branches = res.data || [];
        if (!this.isEditMode && !this.selectedBranchId && this.branches.length > 0) {
          const plantBranch = this.branches.find(b => b.isPlant);
          this.selectedBranchId = plantBranch ? plantBranch.id : this.branches[0].id;
          this.previousBranchId = this.selectedBranchId;
          this.loadProducts(this.selectedBranchId);
        }
        this.loadingBranches = false;
      },
      error: () => {
        this.branches = [];
        this.loadingBranches = false;
      }
    });
  }

  loadCustomers(): void {
    this.loadingCustomers = true;
    this.customersService.getCustomers().subscribe({
      next: (res) => {
        this.customers = res.data || [];
        this.loadingCustomers = false;
      },
      error: () => {
        this.customers = [];
        this.loadingCustomers = false;
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
        this.products = [];
        this.loadingProducts = false;
      }
    });
  }

  loadQuotation(id: string): void {
    this.quotationsService.getQuotationById(id).subscribe({
      next: (res) => {
        const q = res.data;
        this.correlative = q.correlative;
        this.selectedBranchId = q.branchId;
        this.previousBranchId = q.branchId;
        this.applyTax = q.applyTax ?? true;
        this.notes = q.notes || '';
        this.validityDays = 15;

        if (q.guestCustomer) {
          this.customerType = 'guest';
          this.selectedCustomerId = null;
          void this.appliedPrices.loadForCustomer(null);
          this.guestCustomer = {
            name: q.guestCustomer.name || '',
            nit: q.guestCustomer.nit || '',
            email: q.guestCustomer.email || '',
            phone: q.guestCustomer.phone || ''
          };
        } else {
          this.customerType = 'registered';
          this.selectedCustomerId = q.customerId || null;
          void this.appliedPrices.loadForCustomer(this.selectedCustomerId).then(() => this.refreshCustomPriceFlags());
        }

        if (q.branchId) {
          this.loadProducts(q.branchId);
        }

        this.items = (q.items || []).map(item => ({
          productId: item.productId,
          sku: item.product?.sku || '',
          name: item.productName || item.product?.name || 'Producto',
          imageUrl: item.product?.imageUrl,
          price: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 1,
          discount: item.discountType === 'fixed_amount' ? Number(item.discountAmount || 0) : Number(item.discount || 0),
          discountType: item.discountType || 'percentage',
          maxStock: item.product?.stock ?? 0,
          unitName: item.product?.unit?.name || '',
          unitAbbreviation: item.product?.unit?.abbreviation || 'un',
          allowsDecimals: item.product?.unit?.allowsDecimals ?? false,
          isAvailable: item.product?.isAvailable,
          isUnlimited: !!(item.product?.isAvailable && (!item.product?.stock || item.product?.stock === 0)),
          listPrice: Number(item.product?.price || item.unitPrice || 0),
          isCustomPrice: this.appliedPrices.isCustom(item.productId),
        }));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la cotización para edición'
        });
      }
    });
  }

  getCustomerById(id: string | null): ICustomer | undefined {
    if (!id) return undefined;
    return this.customers.find(c => c.id === id);
  }

  private refreshCustomPriceFlags(): void {
    this.items = this.items.map((item) => ({
      ...item,
      isCustomPrice: this.appliedPrices.isCustom(item.productId),
    }));
  }

  onBranchChange(branchId: string | null): void {
    if (this.items.length > 0 && branchId !== this.previousBranchId) {
      this.pendingBranchId = branchId;
      this.showBranchChangeConfirmModal = true;
      return;
    }

    this.selectedBranchId = branchId;
    this.previousBranchId = branchId;
    if (branchId) {
      this.loadProducts(branchId);
    } else {
      this.products = [];
    }
  }

  confirmBranchChange(): void {
    this.showBranchChangeConfirmModal = false;
    this.items = [];
    this.selectedBranchId = this.pendingBranchId;
    this.previousBranchId = this.pendingBranchId;
    if (this.pendingBranchId) {
      this.loadProducts(this.pendingBranchId);
    } else {
      this.products = [];
    }
    this.pendingBranchId = null;
  }

  cancelBranchChange(): void {
    this.showBranchChangeConfirmModal = false;
    this.selectedBranchId = this.previousBranchId;
    this.pendingBranchId = null;
  }

  onCustomerChange(customerId: string | null): void {
    this.selectedCustomerId = customerId;
    void this.appliedPrices.loadForCustomer(customerId || null).then(() => {
      this.items = this.items.map((item) => {
        const product = this.products.find((p) => p.id === item.productId);
        if (!product) return item;
        return {
          ...item,
          price: this.appliedPrices.unitPriceFor(product),
          listPrice: Number(product.price || 0),
          isCustomPrice: this.appliedPrices.isCustom(product.id),
        };
      });
    });
  }

  onProductSelectFromRibbon(event: { product: Product; quantity: number }): void {
    const { product, quantity } = event;
    const qty = quantity || 1;
    const isUnlimited = !!(product.isAvailable && (!product.stock || product.stock === 0));
    
    this.items.push({
      productId: product.id,
      sku: product.sku || '',
      name: product.name,
      imageUrl: product.imageUrl,
      price: this.appliedPrices.unitPriceFor(product),
      quantity: qty,
      discount: 0,
      discountType: 'percentage',
      maxStock: product.stock ?? 0,
      unitName: product.unit?.name || '',
      unitAbbreviation: product.unit?.abbreviation || 'un',
      allowsDecimals: product.unit?.allowsDecimals ?? false,
      isAvailable: product.isAvailable,
      isUnlimited,
      listPrice: Number(product.price || 0),
      isCustomPrice: this.appliedPrices.isCustom(product.id),
    });
  }

  isProductSelected = (productId: string): boolean => {
    return this.items.some(i => i.productId === productId);
  };

  getItemQuantity = (productId: string): number | undefined => {
    const matchingItems = this.items.filter(i => i.productId === productId);
    if (matchingItems.length === 0) return undefined;
    return matchingItems.reduce((acc, i) => acc + (i.quantity || 0), 0);
  };

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  clearAllItems(): void {
    this.items = [];
  }

  get totalUnitsCount(): number {
    return this.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
  }

  get totalGross(): number {
    return this.items.reduce((acc, i) => acc + ((i.quantity || 0) * (i.price || 0)), 0);
  }

  get totalDiscount(): number {
    return this.items.reduce((acc, i) => acc + this.getItemDiscountAmount(i), 0);
  }

  get totalEstimatedValue(): number {
    return this.subtotal;
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  setCustomerType(type: 'registered' | 'guest'): void {
    this.customerType = type;
    if (type === 'guest') {
      this.onCustomerChange(null);
    }
  }

  onSave(): void {
    if (!this.selectedBranchId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar una sucursal.'
      });
      return;
    }

    if (this.customerType === 'registered' && !this.selectedCustomerId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un cliente registrado.'
      });
      return;
    }

    if (this.customerType === 'guest' && !this.guestCustomer.name.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe ingresar el nombre del cliente invitado.'
      });
      return;
    }

    if (this.items.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debes añadir al menos un producto al detalle de la cotización.'
      });
      return;
    }

    const payload: CreateQuotationDto = {
      branchId: this.selectedBranchId,
      validityDays: Number(this.validityDays) || 15,
      applyTax: this.applyTax,
      notes: this.notes.trim() || undefined,
      items: this.items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        discountType: item.discountType || 'percentage',
        taxPercentage: 12
      }))
    };

    if (this.customerType === 'registered') {
      payload.customerId = this.selectedCustomerId!;
    } else {
      payload.guestCustomer = {
        name: this.guestCustomer.name.trim(),
        nit: this.guestCustomer.nit.trim() || undefined,
        email: this.guestCustomer.email.trim() || undefined,
        phone: this.guestCustomer.phone.trim() || undefined
      };
    }

    this.saving = true;

    const request = this.isEditMode
      ? this.quotationsService.updateQuotation(this.route.snapshot.params['id'], payload)
      : this.quotationsService.createQuotation(payload);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Cotización ${this.isEditMode ? 'actualizada' : 'generada'} correctamente.`
        });
        this.saving = false;
        this.router.navigate(['/sales/quotations']);
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo guardar la cotización'
        });
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    if (this.items.length > 0) {
      this.showCancelConfirmModal = true;
      return;
    }
    this.router.navigate(['/sales/quotations']);
  }

  executeCancelExit(): void {
    this.showCancelConfirmModal = false;
    this.router.navigate(['/sales/quotations']);
  }
}

