import { Component, inject, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { Product } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { InventoryService } from '../../services/inventory.service';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../auth/auth.service';

import { forkJoin } from 'rxjs';

import { BranchSelectComponent } from '../../../shared/components/branch-select/branch-select.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../shared/components/secondary-button/secondary-button.component';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    BranchSelectComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    InputNumber,
    InputGroup,
    InputGroupAddon,
    ButtonModule,
    ReactiveFormsModule,
    ToggleSwitchModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
  ],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.css',
})
export class InventoryFormComponent implements OnInit {
  @ViewChild('ribbonContainer') ribbonContainer?: ElementRef<HTMLDivElement>;

  private productsService = inject(ProductsService);
  private branchesService = inject(BranchesService);
  private inventoryService = inject(InventoryService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  @Input() isModal = false;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  inventoryForm!: FormGroup;
  products: Product[] = [];
  branches: Branch[] = [];
  productSearchTerm: string = '';
  isSuperAdmin: boolean = false;
  isSaving: boolean = false;
  isLoadingBranches: boolean = true;
  isLoadingProducts: boolean = true;

  get filteredRibbonProducts(): Product[] {
    if (!this.productSearchTerm.trim()) {
      return this.products;
    }
    const term = this.productSearchTerm.trim().toLowerCase();
    return this.products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term) ||
        p.category?.name?.toLowerCase().includes(term)
    );
  }

  ngOnInit(): void {
    this.initForm();
    this.checkUserRole();
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoadingBranches = true;
    this.isLoadingProducts = true;

    this.branchesService.getBranches({ minimal: true }).subscribe({
      next: (res) => {
        this.branches = res.data || [];
        this.isLoadingBranches = false;

        // Seleccionar por defecto la primera sucursal con flag isPlant
        if (this.branches.length > 0 && !this.inventoryForm.get('branchId')?.value) {
          const plantBranch = this.branches.find((b) => b.isPlant);
          if (plantBranch) {
            this.inventoryForm.patchValue({ branchId: plantBranch.id });
          }
        }
      },
      error: () => {
        this.isLoadingBranches = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las sucursales.',
        });
      },
    });

    this.productsService.getProducts(undefined, false, undefined, undefined, false, undefined, undefined, true).subscribe({
      next: (res) => {
        this.products = res.data || [];
        this.isLoadingProducts = false;
      },
      error: () => {
        this.isLoadingProducts = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los productos.',
        });
      },
    });
  }

  initForm() {
    this.inventoryForm = this.fb.group({
      branchId: ['', [Validators.required]],
      items: this.fb.array([], [Validators.required]),
    });
  }

  get items(): FormArray {
    return this.inventoryForm.get('items') as FormArray;
  }

  isProductSelected(productId: string): boolean {
    return this.items.controls.some((ctrl) => ctrl.get('productId')?.value === productId);
  }

  scrollRibbon(direction: 'left' | 'right'): void {
    if (!this.ribbonContainer?.nativeElement) return;
    const scrollAmount = 280;
    this.ribbonContainer.nativeElement.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  }

  toggleProduct(product: Product): void {
    const existingIndex = this.items.controls.findIndex((ctrl) => ctrl.get('productId')?.value === product.id);
    if (existingIndex > -1) {
      this.removeItem(existingIndex);
    } else {
      this.addProduct(product);
    }
  }

  addProduct(product: Product): void {
    const isManageStock = product.manageStock !== false;
    const itemGroup = this.fb.group({
      productId: [product.id, [Validators.required]],
      name: [product.name || ''],
      sku: [product.sku || ''],
      manageStock: [isManageStock],
      stock: [
        isManageStock ? null : 0,
        isManageStock ? [Validators.required, Validators.min(0.000001)] : [],
      ],
      isAvailable: [true],
      minStockActivated: [false],
      maxStockActivated: [false],
      minStock: [0],
      maxStock: [0],
      unitAbbreviation: [product.unit?.abbreviation || ''],
      allowsDecimals: [product.unit?.allowsDecimals ?? false],
      imageUrl: [product.imageUrl || ''],
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  clearAllItems(): void {
    this.items.clear();
  }

  isFormValid(): boolean {
    if (!this.inventoryForm || this.inventoryForm.invalid) {
      return false;
    }

    const branchId = this.inventoryForm.get('branchId')?.value;
    if (!branchId) {
      return false;
    }

    if (this.items.length === 0) {
      return false;
    }

    // Verify each item
    for (let i = 0; i < this.items.length; i++) {
      const itemGroup = this.items.at(i) as FormGroup;
      const val = itemGroup.getRawValue();
      if (!val.productId) {
        return false;
      }
      if (val.manageStock) {
        if (val.stock === null || val.stock === undefined || Number(val.stock) <= 0) {
          return false;
        }
        if (val.minStockActivated && (val.minStock === null || val.minStock === undefined || Number(val.minStock) < 0)) {
          return false;
        }
        if (val.maxStockActivated && (val.maxStock === null || val.maxStock === undefined || Number(val.maxStock) < 0)) {
          return false;
        }
        if (val.minStockActivated && val.maxStockActivated && Number(val.minStock) > Number(val.maxStock)) {
          return false;
        }
      }
    }

    return true;
  }

  checkUserRole() {
    this.isSuperAdmin = this.authService.hasPermission('products.manage_global_stock');
    const user = this.authService.currentUser;

    if (user?.roles?.some((r) => r.isSuperAdmin)) {
      this.isSuperAdmin = true;
    }

    if (!this.isSuperAdmin) {
      const userAny = user as any;
      let userBranchId: string | undefined;

      if (userAny.branchId) {
        userBranchId = userAny.branchId;
      } else if (userAny.branch?.id) {
        userBranchId = userAny.branch.id;
      }

      if (userBranchId) {
        this.inventoryForm.get('branchId')?.setValue(userBranchId);
        this.inventoryForm.get('branchId')?.disable();
      }
    }
  }

  loadProducts() {
    this.isLoadingProducts = true;
    this.productsService
      .getProducts(undefined, false, undefined, undefined, false, undefined, undefined, true)
      .subscribe({
        next: (response) => {
          this.products = response.data || [];
          this.isLoadingProducts = false;
        },
        error: (error) => {
          this.isLoadingProducts = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error cargando los productos: ${error.error?.message || error.message || 'Error desconocido'}`,
          });
        },
      });
  }

  loadBranches(): void {
    this.branchesService.getBranches({ minimal: true }).subscribe({
      next: (response) => {
        this.branches = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las sucursales: ${error.error.message}`,
        });
      },
    });
  }

  onSaveInventory(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos en cada producto',
      });
      return;
    }

    const branchId = this.inventoryForm.get('branchId')?.value;
    const itemsValue = this.items.getRawValue();

    if (!branchId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Seleccione una sucursal',
      });
      return;
    }

    if (itemsValue.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin productos',
        detail: 'Añade al menos un producto a la lista',
      });
      return;
    }

    // Validate stock ranges
    for (let i = 0; i < itemsValue.length; i++) {
      const item = itemsValue[i];
      if (item.manageStock && item.minStockActivated && item.maxStockActivated && Number(item.minStock) > Number(item.maxStock)) {
        this.messageService.add({
          severity: 'error',
          summary: 'Rango Inválido',
          detail: `En la fila ${i + 1}, el stock mínimo no puede ser mayor al máximo.`,
        });
        return;
      }
    }

    // Build bulk payload
    const payload = {
      branchId: branchId,
      items: itemsValue.map((item: any) => ({
        productId: item.productId,
        stock: item.manageStock ? (Number(item.stock) || 0) : 0,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        minStock: item.manageStock && item.minStockActivated && item.minStock !== null ? Number(item.minStock) : null,
        maxStock: item.manageStock && item.maxStockActivated && item.maxStock !== null ? Number(item.maxStock) : null,
      })),
    };

    this.isSaving = true;
    this.inventoryService.createBulkInventories(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `${itemsValue.length} inventario(s) registrado(s) correctamente.`,
        });
        if (this.isModal) {
          this.onSaved.emit();
        } else {
          this.router.navigate(['/inventory/inventories']);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error creando inventarios: ${error.error?.message || 'Error en la petición'}`,
        });
        this.isSaving = false;
      },
      complete: () => (this.isSaving = false),
    });
  }

  onCancelProccess() {
    if (this.isModal) {
      this.onClose.emit();
      return;
    }

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
        this.router.navigate(['inventory/inventories']);
      },
    });
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return `${environment.baseUrl}/uploads/products/default-product.png`;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${environment.baseUrl}${imageUrl}`;
  }
}
