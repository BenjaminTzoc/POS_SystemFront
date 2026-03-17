import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

import { ProductionOrderService } from '../../services/production-order.service';
import { ProductsService } from '../../../inventory/services/products.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { RecipeService } from '../../services/recipe.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { Product, ProductType } from '../../../inventory/interfaces/product.interface';
import { IRecipeIngredient } from '../../interfaces/recipe.interface';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { Inventory } from '../../../inventory/interfaces/inventory.interface';
import { environment } from '../../../../environments/environment';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-production-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    SelectModule,
    InputNumberModule,
    TooltipModule,
    TagModule,
    TableModule,
    DecimalPipe,
    CurrencyPipe,
    TextareaModule
  ],
  templateUrl: './order-form.component.html'
})
export class ProductionOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productionService = inject(ProductionOrderService);
  private productsService = inject(ProductsService);
  private branchesService = inject(BranchesService);
  private recipeService = inject(RecipeService);
  private inventoryService = inject(InventoryService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  orderForm: FormGroup;
  saving = signal<boolean>(false);
  loadingData = signal<boolean>(false);

  products = signal<Product[]>([]);
  groupedProducts = signal<any[]>([]);
  branches = signal<Branch[]>([]);
  
  selectedProduct = signal<Product | undefined>(undefined);
  selectedBranchId = signal<string | null>(null);
  mainProductStock = signal<number>(0);
  plannedQuantity = signal<number>(0);
  ingredientStocks = signal<Record<string, number>>({});

  availableStock = computed(() => this.mainProductStock());

  activeRecipe = signal<IRecipeIngredient[]>([]);
  preFlightCheck = computed(() => {
    const recipe = this.activeRecipe();
    const plannedQty = this.plannedQuantity();
    const branchId = this.selectedBranchId();
    const stocks = this.ingredientStocks();

    if (!recipe.length) return [];

    return recipe.map(ing => {
      const required = ing.quantity * plannedQty;
      const componentId = ing.componentId || (ing as any).component_id || ing.component?.id;
      const stock = stocks[componentId] || 0;
      
      return {
        ...ing,
        required,
        available: stock,
        isOk: branchId ? (stock >= required) : true
      };
    });
  });

  totalEstimatedCost = computed(() => {
    const check = this.preFlightCheck();
    const plannedQty = this.plannedQuantity();
    return check.reduce((acc, item) => acc + (item.required * Number(item.component?.cost || 0)), 0);
  });

  hasShortage = computed(() => {
    return this.preFlightCheck().some(item => !item.isOk);
  });

  constructor() {
    this.orderForm = this.fb.group({
      productId: [null, Validators.required],
      branchId: [null, Validators.required],
      plannedQuantity: [0, [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormListeners();
  }

  loadInitialData(): void {
    this.loadingData.set(true);
    
    // Solo productos que se pueden "manufacturar" (terminados o componentes con receta)
    this.productsService.getProducts(undefined, false, undefined, true).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          // Lista plana para lógica interna y búsquedas (incluyendo variantes)
          const allFlat: Product[] = [];
          res.data.forEach(p => {
            allFlat.push(p);
            if (p.variants && p.variants.length > 0) {
              allFlat.push(...p.variants);
            }
          });
          this.products.set(allFlat);

          // Estructura agrupada para el Selector de la UI
          const clusters: any[] = [];
          const standalone: Product[] = [];

          res.data.filter(p => !p.isVariant).forEach(p => {
            if (p.isMaster && p.variants && p.variants.length > 0) {
              clusters.push({
                label: p.name,
                items: p.variants
              });
            } else {
              standalone.push(p);
            }
          });

          if (standalone.length > 0) {
            clusters.push({
              label: 'Productos',
              items: standalone
            });
          }
          this.groupedProducts.set(clusters);
        }
      }
    });

    this.branchesService.getBranches({ isPlant: true }).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
          if (res.data.length === 1) {
            this.orderForm.patchValue({ branchId: res.data[0].id });
          }
        }
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  setupFormListeners(): void {
    this.orderForm.get('productId')?.valueChanges.subscribe(id => {
      const product = this.products().find(p => p.id === id);
      this.selectedProduct.set(product);
      this.loadRecipeAndStocks(id, this.orderForm.get('branchId')?.value);
    });

    this.orderForm.get('branchId')?.valueChanges.subscribe(branchId => {
      this.selectedBranchId.set(branchId);
      this.loadRecipeAndStocks(this.orderForm.get('productId')?.value, branchId);
    });

    this.orderForm.get('plannedQuantity')?.valueChanges.subscribe(qty => {
      this.plannedQuantity.set(qty || 0);
    });
  }

  loadRecipeAndStocks(productId: string | null, branchId: string | null): void {
    if (!productId) {
      this.activeRecipe.set([]);
      this.ingredientStocks.set({});
      this.mainProductStock.set(0);
      return;
    }

    if (branchId) {
      // Consultar stock del producto principal
      this.inventoryService.getInventoryByProductAndBranch(productId, branchId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            this.mainProductStock.set(res.data.stock);
          }
        },
        error: () => this.mainProductStock.set(0)
      });
    }

    this.recipeService.getRecipeByProduct(productId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.activeRecipe.set(res.data);
          if (branchId) {
            this.loadIngredientsStock(res.data, branchId);
          }
        }
      }
    });
  }

  loadIngredientsStock(ingredients: IRecipeIngredient[], branchId: string): void {
    const newStocks: Record<string, number> = {};
    let loadedCount = 0;

    // Limpiar stocks previos para evitar datos obsoletos mientras carga
    this.ingredientStocks.set({});

    if (ingredients.length === 0) return;

    ingredients.forEach(ing => {
      const componentId = ing.componentId || (ing as any).component_id || ing.component?.id;
      if (!componentId) {
        loadedCount++;
        if (loadedCount === ingredients.length) {
          this.ingredientStocks.set(newStocks);
        }
        return;
      }

      this.inventoryService.getInventoryByProductAndBranch(componentId, branchId).subscribe({
        next: (res) => {
          if (res.statusCode === 200) {
            newStocks[componentId] = res.data.stock;
          }
          loadedCount++;
          if (loadedCount === ingredients.length) {
            this.ingredientStocks.set(newStocks);
          }
        },
        error: () => {
          newStocks[componentId] = 0;
          loadedCount++;
          if (loadedCount === ingredients.length) {
            this.ingredientStocks.set(newStocks);
          }
        }
      });
    });
  }

  onSave(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.productionService.createOrder(this.orderForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de producción creada correctamente'
        });
        this.router.navigate(['/production/orders']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al crear la orden'
        });
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/production/orders']);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
