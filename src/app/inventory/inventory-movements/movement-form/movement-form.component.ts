import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../auth/auth.service';
import { Router } from '@angular/router';
import { Product } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { environment } from '../../../../environments/environment';
import { InventoryMovementsService } from '../../services/inventory-movements.service';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-movement-form',
  imports: [ReactiveFormsModule, Select, ButtonModule, InputTextModule, InputNumberModule],
  templateUrl: './movement-form.component.html',
  styleUrl: './movement-form.component.css',
})
export class MovementFormComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly inventoryMovementsService = inject(InventoryMovementsService);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  movementForm: FormGroup;
  products: Product[] = [];
  branches: Branch[] = [];
  availableBranches: Branch[] = [];
  selectedProduct: Product | undefined;
  isSuperAdmin: boolean = false;
  currentStock: number | null = null;

  movementTypes = [
    { label: 'Entrada', value: 'in', description: 'El stock disponible aumenta' },
    { label: 'Salida', value: 'out', description: 'El stock disponible se reduce' },
  ];

  concepts: { label: string; value: string; types: string[] }[] = [
    { label: 'Ajuste de Inventario', value: 'adjustment', types: ['in', 'out'] },
    { label: 'Merma / Desperdicio', value: 'waste', types: ['out'] },
    { label: 'Devolución', value: 'return', types: ['in'] },
  ];

  filteredConcepts: { label: string; value: string }[] = [];

  constructor() {
    this.movementForm = this.fb.group({
      productId: [null, [Validators.required]],
      branchId: [{ value: null, disabled: true }, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      type: [null, [Validators.required]],
      concept: [null, [Validators.required]],
      notes: [null],
      movementDate: [new Date(), [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadProducts();
    this.loadBranches();
    this.setupFormSubscriptions();
  }

  setupFormSubscriptions() {
    // Listen to type changes to filter concepts
    this.movementForm.get('type')?.valueChanges.subscribe((type) => {
      this.filteredConcepts = this.concepts
        .filter((c) => c.types.includes(type))
        .map((c) => ({ label: c.label, value: c.value }));

      const currentConcept = this.movementForm.get('concept')?.value;
      if (currentConcept && !this.filteredConcepts.find((c) => c.value === currentConcept)) {
        this.movementForm.get('concept')?.setValue(null);
      }
    });

    // Listen to branch changes to update current stock display
    this.movementForm.get('branchId')?.valueChanges.subscribe((branchId) => {
      this.updateCurrentStock(branchId);
    });
  }

  updateCurrentStock(branchId: string | null) {
    if (!branchId || !this.selectedProduct?.inventories) {
      this.currentStock = null;
      return;
    }

    const inventory = this.selectedProduct.inventories.find((i) => i.branch.id === branchId);
    this.currentStock = inventory ? inventory.stock : 0;
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
        this.movementForm.get('branchId')?.setValue(userBranchId);
        // Note: It stays disabled as initialized, but checkUserRole is called before onProductChange.
        // We'll handle the logic in onProductChange to properly manage enabling.
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
      this.availableBranches = [];
      this.movementForm.get('branchId')?.disable();
      this.movementForm.get('branchId')?.setValue(null);
      this.currentStock = null;
      return;
    }

    this.productsService.getProduct(selectedProductId).subscribe({
      next: (response) => {
        if (response.statusCode === 200) {
          this.selectedProduct = response.data;

          // Filter branches that have stock for this product
          const branchesWithStockIds =
            this.selectedProduct.inventories?.filter((i) => i.stock >= 0).map((i) => i.branch.id) ||
            [];

          this.availableBranches = this.branches.filter((b) => branchesWithStockIds.includes(b.id));

          const branchControl = this.movementForm.get('branchId');

          if (this.isSuperAdmin) {
            branchControl?.enable();
            branchControl?.setValue(null);
          } else {
            const currentBranchId = branchControl?.value;
            this.updateCurrentStock(currentBranchId);
          }
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

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return `${environment.baseUrl}/uploads/products/default-product.png`;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${environment.baseUrl}${imageUrl}`;
  }

  onCancel() {
    this.router.navigate(['/inventory/inventory-movements']);
  }

  onSave() {
    if (this.movementForm.invalid) {
      this.movementForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Inválido',
        detail: 'Por favor completa todos los campos requeridos.',
      });
      return;
    }

    const body = this.movementForm.getRawValue();

    this.inventoryMovementsService.createInventoryMovement(body).subscribe({
      next: (response) => {
        if (response.statusCode === 201 || response.statusCode === 200) {
          this.messageService.add({
            severity: 'success',
            summary: 'Movimiento registrado',
            detail: 'El movimiento de inventario se ha guardado correctamente.',
          });
          this.router.navigate(['/inventory/inventory-movements']);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo registrar el movimiento: ${error.error.message}`,
        });
      },
    });
  }
}
