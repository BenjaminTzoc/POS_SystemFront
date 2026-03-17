import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Select, SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { LogisticsService } from '../../../services/logistics.service';
import { RouteDispatch } from '../../../interfaces/route-dispatch.interface';
import { BranchesService } from '../../../../inventory/services/branches.service';
import { ProductsService } from '../../../../inventory/services/products.service';
import { Branch } from '../../../../inventory/interfaces/branch.interface';
import { Product } from '../../../../inventory/interfaces/product.interface';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dispatch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePicker,
    DatePickerModule,
    TooltipModule
  ],
  templateUrl: './dispatch-form.component.html',
})
export class DispatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private logisticsService = inject(LogisticsService);
  private branchesService = inject(BranchesService);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);

  dispatchForm: FormGroup;
  originBranches = signal<Branch[]>([]);
  branches = signal<Branch[]>([]);
  products = signal<Product[]>([]);
  saving = signal(false);

  constructor() {
    this.dispatchForm = this.fb.group({
      date: [new Date(), [Validators.required]],
      originBranchId: [null, [Validators.required]],
      branchId: [null, [Validators.required]],
      notes: [''],
      items: this.fb.array([], [Validators.required])
    });
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  private createItemGroup(): FormGroup {
    return this.fb.group({
      productId: [null, [Validators.required]],
      sentQuantity: [1, [Validators.required, Validators.min(0.01)]],
      unitAbbreviation: [''],
      stock: [0],
      allowsDecimals: [true]
    });
  }

  get items() {
    return this.dispatchForm.get('items') as FormArray;
  }

  loadBranches() {
    // Sucursal Origen (Plantas)
    this.branchesService.getBranches({ isPlant: true }).subscribe({
      next: (res) => this.originBranches.set(res.data),
      error: (err) => this.showError('Error', 'No se pudieron cargar las plantas de producción')
    });

    // Sucursal Destino (No Plantas)
    this.branchesService.getBranches({ isPlant: false }).subscribe({
      next: (res) => this.branches.set(res.data),
      error: (err) => this.showError('Error', 'No se pudieron cargar las sucursales destino')
    });
  }

  onOriginBranchChange() {
    const originBranchId = this.dispatchForm.get('originBranchId')?.value;
    if (originBranchId) {
      this.loadProducts(originBranchId);
    } else {
      this.products.set([]);
    }
    
    // Al cambiar la planta, resetear los items por completo
    this.items.clear();
  }

  loadProducts(branchId?: string) {
    this.productsService.getDispatchCatalog(branchId).subscribe({
      next: (res) => {
        // Mapa para evitar duplicados y facilitar búsqueda por ID
        const productMap = new Map<string, Product>();
        res.data.forEach(p => {
          productMap.set(p.id, p);
          if (p.variants) {
            p.variants.forEach(v => productMap.set(v.id, v));
          }
        });
        
        this.allRelevantProducts = Array.from(productMap.values());
        this.products.set(res.data);
      },
      error: (err) => this.showError('Error', 'No se pudieron cargar los productos')
    });
  }

  private allRelevantProducts: Product[] = [];

  addItem() {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  onProductChange(index: number, event: any) {
    const productId = event.value;
    const group = this.items.at(index) as FormGroup;

    const product = this.allRelevantProducts.find(p => p.id === productId);
    
    if (product) {
      const availableStock = product.inventories && product.inventories.length > 0 
        ? product.inventories[0].stock 
        : (product.stock || 0);

      const patchData: any = {
        productId: productId,
        unitAbbreviation: product.unit?.abbreviation || '',
        stock: availableStock,
        allowsDecimals: product.unit?.allowsDecimals ?? true
      };

      // Si el campo está vacío, sugerimos 1. 
      // Si ya tiene valor (1, 2, etc), NO enviamos sentQuantity en el patch para no pisarlo.
      const currentQty = group.get('sentQuantity')?.value;
      if (currentQty === null || currentQty === undefined) {
        patchData.sentQuantity = 1;
      } else if (product.unit?.allowsDecimals === false && currentQty % 1 !== 0) {
        patchData.sentQuantity = Math.floor(currentQty);
      }

      group.patchValue(patchData);
    }
  }

  getAvailableProducts(index: number): Product[] {
    const selectedProductIds = this.items.controls
      .map((control, i) => (i !== index ? control.get('productId')?.value : null))
      .filter((id) => id !== null);

    // Usamos allRelevantProducts para asegurar que incluimos variantes de la lista plana
    return this.allRelevantProducts
      .filter(p => !selectedProductIds.includes(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getProductImageUrl(url?: string): string {
    if (!url) return `${environment.baseUrl}/uploads/products/default-product.png`;
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  onCancel() {
    this.router.navigate(['/logistics/dispatches']);
  }

  onSave() {
    if (this.dispatchForm.invalid) {
      this.dispatchForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, completa todos los campos requeridos.'
      });
      return;
    }

    this.saving.set(true);
    const formValue = this.dispatchForm.value;
    
    // Format date to YYYY-MM-DD
    const dateObj = formValue.date instanceof Date ? formValue.date : new Date(formValue.date);
    const formattedDate = dateObj.toISOString().split('T')[0];

    const payload: RouteDispatch = {
      date: formattedDate,
      originBranchId: formValue.originBranchId,
      branchId: formValue.branchId,
      notes: formValue.notes,
      items: this.items.controls.map(itemGroup => ({
        productId: itemGroup.get('productId')?.value,
        sentQuantity: itemGroup.get('sentQuantity')?.value
      }))
    };

    this.logisticsService.createRouteDispatch(payload).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Despacho creado correctamente' 
        });
        setTimeout(() => this.router.navigate(['/logistics/dispatches']), 1500);
      },
      error: (err) => {
        this.saving.set(false);
        this.showError('Error', err.error?.message || 'Error al crear el despacho');
      }
    });
  }

  private showError(summary: string, detail: string) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail
    });
  }
}
