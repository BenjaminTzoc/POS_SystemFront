import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import { environment } from '../../../../environments/environment';

import { ProductsService } from '../../../inventory/services/products.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { DecompositionService } from '../../services/decomposition.service';
import { Product, ProductType } from '../../../inventory/interfaces/product.interface';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { ICreateDecomposition } from '../../interfaces/decomposition.interface';

@Component({
  selector: 'app-decomposition-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    TableModule,
    TooltipModule,
    CurrencyPipe
  ],
  templateUrl: './decomposition-form.component.html',
})
export class DecompositionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private branchesService = inject(BranchesService);
  private decompositionService = inject(DecompositionService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  decompositionForm: FormGroup;
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  rawMaterials = signal<Product[]>([]);
  components = signal<Product[]>([]);
  branches = signal<Branch[]>([]);

  selectedInputProduct = signal<Product | undefined>(undefined);
  selectedBranchId = signal<string | null>(null);
  inputQuantity = signal<number>(1);
  itemsValue = signal<any[]>([]);

  availableStock = computed(() => {
    const product = this.selectedInputProduct();
    const branchId = this.selectedBranchId();
    if (!product || !branchId || !product.inventories) return 0;
    
    // El backend devuelve inventories como un arreglo de objetos con branchId y stock
    const inventory = (product.inventories as any[]).find(inv => inv.branchId === branchId);
    return inventory ? inventory.stock : 0;
  });

  totalPercentage = computed(() => {
    const items = this.itemsValue();
    return items.reduce((acc, curr) => acc + (Number(curr.costPercentage) || 0), 0);
  });

  totalOutputQuantity = computed(() => {
    const items = this.itemsValue();
    return items.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  });

  weightShrinkage = computed(() => {
    const input = this.inputQuantity();
    const output = this.totalOutputQuantity();
    return Math.max(0, input - output);
  });

  shrinkagePercentage = computed(() => {
    const input = this.inputQuantity();
    if (input <= 0) return 0;
    return (this.weightShrinkage() / input) * 100;
  });

  yieldPercentage = computed(() => {
    const input = this.inputQuantity();
    const output = this.totalOutputQuantity();
    if (input <= 0) return 0;
    return (output / input) * 100;
  });

  constructor() {
    this.decompositionForm = this.fb.group({
      inputProductId: [null, Validators.required],
      branchId: [null, Validators.required],
      inputQuantity: [1, [Validators.required, Validators.min(0.01)]],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      items: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  setupFormSubscriptions(): void {
    this.decompositionForm.get('inputProductId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        const product = this.rawMaterials().find(p => p.id === id);
        this.selectedInputProduct.set(product);
        this.calculateAutoTotalCost();
      });

    this.decompositionForm.get('branchId')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedBranchId.set(id);
      });

    this.decompositionForm.get('inputQuantity')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((qty) => {
        this.inputQuantity.set(qty || 0);
        this.calculateAutoTotalCost();
      });

    // Suscribirse a cambios en el FormArray
    this.items.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        this.itemsValue.set(val || []);
      });
  }

  calculateAutoTotalCost(): void {
    const product = this.selectedInputProduct();
    const quantity = this.decompositionForm.get('inputQuantity')?.value || 0;
    
    if (product && quantity > 0) {
      const baseCost = Number(product.cost) || 0;
      const totalCost = baseCost * quantity;
      this.decompositionForm.get('totalCost')?.setValue(totalCost, { emitEvent: false });
    }
  }

  get items(): FormArray {
    return this.decompositionForm.get('items') as FormArray;
  }

  loadInitialData(): void {
    this.loading.set(true);
    
    // Cargar materias primas
    this.productsService.getProducts(undefined, false, ProductType.RAW_MATERIAL).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.rawMaterials.set(res.data);
        }
      }
    });

    // Cargar componentes (cortes resultantes)
    this.productsService.getProducts(undefined, false, ProductType.COMPONENT).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.components.set(res.data);
        }
      }
    });

    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
          if (res.data.length === 1) {
            this.decompositionForm.get('branchId')?.setValue(res.data[0].id);
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addItem(): void {
    const itemGroup = this.fb.group({
      productId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0.01)]],
      costPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });
    this.items.push(itemGroup);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.itemsValue.set(this.items.value); // Forzar actualización del signal al remover
  }

  calculateItemCost(percentage: number): number {
    const totalCost = this.decompositionForm.get('totalCost')?.value || 0;
    return (totalCost * percentage) / 100;
  }

  calculateUnitPrice(percentage: number, quantity: number): number {
    if (!quantity || quantity <= 0) return 0;
    return this.calculateItemCost(percentage) / quantity;
  }

  onSave(): void {
    if (this.decompositionForm.invalid) {
      this.decompositionForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Por favor complete todos los campos obligatorios.'
      });
      return;
    }

    if (this.totalPercentage() !== 100) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error en Costos',
        detail: 'La sumatoria de porcentajes de costo debe ser exactamente 100%.'
      });
      return;
    }

    this.saving.set(true);
    const payload: ICreateDecomposition = {
      ...this.decompositionForm.getRawValue(),
      wasteQuantity: this.weightShrinkage()
    };

    this.decompositionService.createDecomposition(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Proceso de despiece registrado satisfactoriamente.'
        });
        this.router.navigate(['/production/decomposition']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Error al guardar el despiece'
        });
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/production/decomposition']);
  }

  getSelectedProduct(productId: string): Product | undefined {
    return this.components().find(p => p.id === productId);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
