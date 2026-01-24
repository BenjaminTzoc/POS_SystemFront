import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidatorFn,
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

@Component({
  selector: 'app-inventory-form',
  imports: [
    InputTextModule,
    Select,
    InputNumber,
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

  inventoryForm!: FormGroup;
  products: Product[] = [];
  branches: Branch[] = [];

  selectedProduct: Product | undefined;
  selectedBranch: Branch | undefined;
  isSuperAdmin: boolean = false;

  checked: boolean = false;
  isSaving: boolean = false;

  ngOnInit(): void {
    this.initForm();
    this.checkUserRole();
    this.loadProducts();
    this.loadBranches();
  }

  initForm() {
    this.inventoryForm = this.fb.group({
      productId: ['', [Validators.required]],
      branchId: ['', [Validators.required]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStockActivated: [false],
      maxStockActivated: [false],
      minStock: [0, this.getMinStockValidations()],
      maxStock: [0, this.getMaxStockValidations()],
    });

    // this.setupCrossValidations();
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

  onBranchChange(event: any) {
    const selectedBranchId = event.value;
  }

  onSaveInventory(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const { minStockActivated, maxStockActivated, ...body } = this.inventoryForm.getRawValue();

    if (!minStockActivated) body.minStock = null;
    if (!maxStockActivated) body.minStock = null;

    if (this.hasInvalidStockRange(body)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: `Ingresa un rango de stock válido`,
      });
      return;
    }

    this.isSaving = true;
    this.inventoryService.createInventory(body).subscribe({
      next: (response) => {
        if (response.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El inventario se ha creado correctamente.`,
          });
          this.router.navigate(['/inventory/inventories']);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error creando el inventario: ${error.error.message}`,
        });
        this.isSaving = false;
      },
      complete: () => (this.isSaving = false),
    });
  }

  private hasInvalidStockRange(body: any): boolean {
    if (body.minStock !== null && body.maxStock !== null) {
      return body.minStock > body.maxStock;
    }
    return false;
  }

  onCancelProccess() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de cancelar este proceso?',
      header: 'Confirmar cancelación',
      icon: 'pi pi-info-circle',
      acceptLabel: 'Cancelar proceso',
      rejectLabel: 'Regresar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',

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

  private getMinStockValidations(): ValidatorFn[] {
    return [Validators.min(0), Validators.pattern(/^\d+$/)];
  }

  private getMaxStockValidations(): ValidatorFn[] {
    return [Validators.min(0), Validators.pattern(/^\d+$/)];
  }

  private setupCrossValidations(): void {
    this.inventoryForm.get('productId')?.valueChanges.subscribe((productId) => {
      this.updateStockValidationsBasedOnProduct();
    });

    this.inventoryForm.get('minStock')?.valueChanges.subscribe(() => {
      this.inventoryForm.get('maxStock')?.updateValueAndValidity();
    });

    this.inventoryForm.get('maxStock')?.valueChanges.subscribe(() => {
      this.inventoryForm.get('minStock')?.updateValueAndValidity();
    });

    this.inventoryForm.get('minStockActivated')?.valueChanges.subscribe((activated) => {
      this.toggleMinStockValidations(activated);
    });

    this.inventoryForm.get('maxStockActivated')?.valueChanges.subscribe((activated) => {
      this.toggleMaxStockValidations(activated);
    });
  }

  private updateStockValidationsBasedOnProduct(): void {
    const stockControl = this.inventoryForm.get('stock');
    const minStockControl = this.inventoryForm.get('minStock');
    const maxStockControl = this.inventoryForm.get('maxStock');

    const allowsDecimals = this.selectedProduct?.unit?.allowsDecimals ?? false;

    const numberValidators = allowsDecimals
      ? [Validators.min(0)]
      : [Validators.min(0), Validators.pattern(/^-?\d+$/)];

    stockControl?.setValidators([Validators.required, ...numberValidators]);
    stockControl?.updateValueAndValidity();

    if (this.inventoryForm.get('minStockActivated')?.value) {
      minStockControl?.setValidators([Validators.required, ...numberValidators]);
    }

    if (this.inventoryForm.get('maxStockActivated')?.value) {
      maxStockControl?.setValidators([Validators.required, ...numberValidators]);
    }

    minStockControl?.updateValueAndValidity();
    maxStockControl?.updateValueAndValidity();
  }

  private toggleMinStockValidations(activated: boolean): void {
    const minStockControl = this.inventoryForm.get('minStock');
    if (activated) {
      minStockControl?.setValidators(this.getMinStockValidations());
    } else {
      minStockControl?.clearValidators();
    }
    minStockControl?.updateValueAndValidity();
  }

  private toggleMaxStockValidations(activated: boolean): void {
    const maxStockControl = this.inventoryForm.get('maxStock');
    if (activated) {
      maxStockControl?.setValidators(this.getMaxStockValidations());
    } else {
      maxStockControl?.clearValidators();
    }
    maxStockControl?.updateValueAndValidity();
  }
}
