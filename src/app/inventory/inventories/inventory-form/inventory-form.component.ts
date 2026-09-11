import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
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

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    CommonModule,
    InputTextModule,
    Select,
    InputNumber,
    InputGroup,
    InputGroupAddon,
    ButtonModule,
    ReactiveFormsModule,
    ToggleSwitchModule,
    FormsModule,
  ],
  templateUrl: './inventory-form.component.html',
  styleUrl: './inventory-form.component.css',
})
export class InventoryFormComponent implements OnInit {
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
  isSuperAdmin: boolean = false;
  isSaving: boolean = false;
  isLoadingData: boolean = true;

  ngOnInit(): void {
    this.initForm();
    this.checkUserRole();
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.isLoadingData = true;
    forkJoin({
      products: this.productsService.getProducts(),
      branches: this.branchesService.getBranches(),
    }).subscribe({
      next: (res) => {
        this.products = res.products.data || [];
        this.branches = res.branches.data || [];
        this.isLoadingData = false;
      },
      error: (err) => {
        this.isLoadingData = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los datos necesarios.',
        });
      },
    });
  }

  initForm() {
    this.inventoryForm = this.fb.group({
      branchId: ['', [Validators.required]],
      items: this.fb.array([], [Validators.required]),
    });

    this.addItem(); // Start with at least 1 item
  }

  get items(): FormArray {
    return this.inventoryForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: ['', [Validators.required]],
      stock: [null, [Validators.required, Validators.min(0.000001)]],
      minStockActivated: [false],
      maxStockActivated: [false],
      minStock: [0],
      maxStock: [0],
      unitAbbreviation: [''],
      allowsDecimals: [false],
      imageUrl: [''],
    });
  }

  addItem() {
    this.items.push(this.createItem());
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  hasAvailableProducts(): boolean {
    if (!this.products || this.products.length === 0) return false;
    const selectedCount = this.items.controls.filter((c) => !!c.get('productId')?.value).length;
    return this.items.length < this.products.length && selectedCount < this.products.length;
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

    // Verify each item has a product selected, stock > 0, and valid min/max ranges if enabled
    for (let i = 0; i < this.items.length; i++) {
      const itemGroup = this.items.at(i) as FormGroup;
      const val = itemGroup.getRawValue();
      if (!val.productId || val.stock === null || val.stock === undefined || Number(val.stock) <= 0) {
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

    return true;
  }

  getAvailableProducts(index: number): Product[] {
    const selectedProductIds = this.items.controls
      .map((control, i) => (i !== index ? control.get('productId')?.value : null))
      .filter((id) => id);

    return this.products.filter((p) => !selectedProductIds.includes(p.id));
  }

  onProductChange(event: any, index: number) {
    const productId = event.value;
    const itemGroup = this.items.at(index) as FormGroup;

    if (!productId) {
      itemGroup.patchValue({
        unitAbbreviation: '',
        allowsDecimals: false,
        imageUrl: '',
      });
      return;
    }

    const prod = this.products.find((p) => p.id === productId);
    if (prod) {
      itemGroup.patchValue({
        unitAbbreviation: prod.unit?.abbreviation || '',
        allowsDecimals: prod.unit?.allowsDecimals ?? false,
        imageUrl: prod.imageUrl || '',
      });
    }
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
    this.productsService.getProducts().subscribe({
      next: (response) => {
        this.products = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los productos: ${error.error.message}`,
        });
      },
    });
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
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
      if (item.minStockActivated && item.maxStockActivated && item.minStock > item.maxStock) {
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
        stock: item.stock,
        minStock: item.minStockActivated ? item.minStock : null,
        maxStock: item.maxStockActivated ? item.maxStock : null,
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
