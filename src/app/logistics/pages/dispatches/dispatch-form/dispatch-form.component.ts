import { Component, ElementRef, inject, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { LogisticsService } from '../../../services/logistics.service';
import { RouteDispatch } from '../../../interfaces/route-dispatch.interface';
import { BranchesService } from '../../../../inventory/services/branches.service';
import { ProductsService } from '../../../../inventory/services/products.service';
import { Branch } from '../../../../inventory/interfaces/branch.interface';
import { Product } from '../../../../inventory/interfaces/product.interface';
import { QuickQuantityService } from '../../../../sales/services/quick-quantity.service';
import { ConfirmationModalComponent } from '../../../../shared/components/confirmation-modal/confirmation-modal.component';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dispatch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    TableModule,
    DrawerModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    ConfirmDialogModule,
    ConfirmationModalComponent
  ],
  providers: [ConfirmationService],
  templateUrl: './dispatch-form.component.html',
})
export class DispatchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private logisticsService = inject(LogisticsService);
  private branchesService = inject(BranchesService);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private quickQuantityService = inject(QuickQuantityService);

  @ViewChild('catalogContainer') catalogContainer!: ElementRef<HTMLDivElement>;

  dispatchForm: FormGroup;
  originBranches = signal<Branch[]>([]);
  branches = signal<Branch[]>([]);
  products = signal<Product[]>([]);
  saving = signal(false);
  loadingProducts = signal(false);

  previousOriginBranchId: string | null = null;
  drawerVisible = false;
  searchProductQuery = '';
  showCancelConfirmModal = false;

  private allRelevantProducts: Product[] = [];

  constructor() {
    this.dispatchForm = this.fb.group({
      date: [new Date(), [Validators.required]],
      originBranchId: [null, [Validators.required]],
      branchId: [null, [Validators.required]],
      notes: [''],
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  get items(): FormArray {
    return this.dispatchForm.get('items') as FormArray;
  }

  get isFormValid(): boolean {
    const originBranchId = this.dispatchForm.get('originBranchId')?.value;
    const branchId = this.dispatchForm.get('branchId')?.value;
    const date = this.dispatchForm.get('date')?.value;

    if (!originBranchId || !branchId || !date) return false;
    if (originBranchId === branchId) return false;
    if (!this.items || this.items.length === 0 || this.items.invalid) return false;

    return true;
  }

  get totalQuantity(): number {
    return this.items.controls.reduce((sum, control) => {
      const qty = Number(control.get('sentQuantity')?.value) || 0;
      return sum + qty;
    }, 0);
  }

  get totalQuantitySummary(): string {
    if (this.items.length === 0) return '0';
    const unitTotals: Record<string, number> = {};
    this.items.controls.forEach(control => {
      const qty = Number(control.get('sentQuantity')?.value) || 0;
      const unit = control.get('unitAbbreviation')?.value || 'un';
      unitTotals[unit] = (unitTotals[unit] || 0) + qty;
    });

    const parts = Object.entries(unitTotals).map(([unit, total]) => {
      const formatted = Number.isInteger(total) ? total.toString() : parseFloat(total.toFixed(2)).toString();
      return `${formatted} ${unit}`;
    });

    return parts.join(' • ');
  }

  get filteredProducts(): Product[] {
    const term = this.searchProductQuery?.toLowerCase().trim();
    if (!term) return this.products();
    return this.products().filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.sku?.toLowerCase().includes(term)
    );
  }

  getOriginBranchName(): string {
    const id = this.dispatchForm.get('originBranchId')?.value;
    return this.originBranches().find(b => b.id === id)?.name || 'Sin seleccionar';
  }

  getDestinationBranchName(): string {
    const id = this.dispatchForm.get('branchId')?.value;
    return this.branches().find(b => b.id === id)?.name || 'Sin seleccionar';
  }

  loadBranches() {
    // Sucursal Origen (Plantas)
    this.branchesService.getBranches({ isPlant: true }).subscribe({
      next: (res) => {
        this.originBranches.set(res.data);
        if (res.data && res.data.length > 0) {
          const defaultOrigin = res.data[0].id;
          this.dispatchForm.patchValue({ originBranchId: defaultOrigin });
          this.previousOriginBranchId = defaultOrigin;
          this.loadProducts(defaultOrigin);
        }
      },
      error: () => this.showError('Error', 'No se pudieron cargar las plantas de producción')
    });

    // Sucursal Destino (No Plantas)
    this.branchesService.getBranches({ isPlant: false }).subscribe({
      next: (res) => this.branches.set(res.data),
      error: () => this.showError('Error', 'No se pudieron cargar las sucursales destino')
    });
  }

  onOriginBranchChange(event: any) {
    const newBranchId = event.value;

    if (this.items.length > 0) {
      this.confirmationService.confirm({
        message: 'Si cambia la planta origen, se limpiarán los productos agregados al despacho. ¿Desea continuar?',
        header: 'Confirmar cambio de planta origen',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cambiar',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.items.clear();
          this.previousOriginBranchId = newBranchId;
          if (newBranchId) {
            this.loadProducts(newBranchId);
          } else {
            this.products.set([]);
          }
        },
        reject: () => {
          this.dispatchForm.get('originBranchId')?.setValue(this.previousOriginBranchId, { emitEvent: false });
        }
      });
    } else {
      this.previousOriginBranchId = newBranchId;
      if (newBranchId) {
        this.loadProducts(newBranchId);
      } else {
        this.products.set([]);
      }
    }
  }

  loadProducts(branchId?: string) {
    this.quickQuantityService.clearAll();
    this.loadingProducts.set(true);
    this.productsService.getDispatchCatalog(branchId).subscribe({
      next: (res) => {
        const productMap = new Map<string, Product>();
        res.data.forEach(p => {
          productMap.set(p.id, p);
          if (p.variants) {
            p.variants.forEach(v => productMap.set(v.id, v));
          }
        });
        
        this.allRelevantProducts = Array.from(productMap.values());
        this.products.set(res.data);
        this.loadingProducts.set(false);
      },
      error: () => {
        this.loadingProducts.set(false);
        this.showError('Error', 'No se pudieron cargar los productos');
      }
    });
  }

  scrollCatalog(direction: 'left' | 'right' | number): void {
    if (this.catalogContainer?.nativeElement) {
      const container = this.catalogContainer.nativeElement;
      let amount = 0;
      if (typeof direction === 'number') {
        amount = direction;
      } else {
        const firstCard = container.firstElementChild as HTMLElement;
        if (firstCard) {
          const cardWidthWithGap = firstCard.offsetWidth + 12;
          amount = (direction === 'left' ? -1 : 1) * (cardWidthWithGap * 3);
        } else {
          amount = (direction === 'left' ? -1 : 1) * container.clientWidth;
        }
      }
      container.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }

  getQuickQuantity(productId: string): number {
    return this.quickQuantityService.getQuantity(productId);
  }

  onQuickQuantityChange(productId: string, event: any): void {
    const val = parseFloat(event.target.value);
    if (!isNaN(val) && val > 0) {
      this.quickQuantityService.setQuantity(productId, val);
    }
  }

  addProductFromDrawer(product: Product): void {
    const qtyToAdd = this.getQuickQuantity(product.id);
    const existingIndex = this.items.controls.findIndex(c => c.get('productId')?.value === product.id);

    const availableStock = product.inventories && product.inventories.length > 0 
      ? product.inventories[0].stock 
      : (product.stock || 0);

    if (existingIndex >= 0) {
      const group = this.items.at(existingIndex) as FormGroup;
      const currentQty = Number(group.get('sentQuantity')?.value) || 0;
      group.patchValue({ sentQuantity: currentQty + qtyToAdd });
    } else {
      this.items.push(this.fb.group({
        productId: [product.id, Validators.required],
        sentQuantity: [qtyToAdd, [Validators.required, Validators.min(0.01)]],
        unitAbbreviation: [product.unit?.abbreviation || 'un'],
        stock: [availableStock],
        allowsDecimals: [product.unit?.allowsDecimals ?? true]
      }));
    }

    this.quickQuantityService.resetQuantity(product.id);
    this.messageService.add({
      severity: 'info',
      summary: 'Producto agregado',
      detail: `${product.name} añadido al despacho`,
      life: 1500
    });
  }

  getProductById(id: string): Product | undefined {
    return this.allRelevantProducts.find(p => p.id === id);
  }

  getProductImageUrl(url?: string): string {
    if (!url) return `${environment.baseUrl}/uploads/products/default-product.png`;
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  asGroup(control: any): FormGroup {
    return control as FormGroup;
  }

  onCancel() {
    if (this.items.length > 0 || this.dispatchForm.dirty) {
      this.showCancelConfirmModal = true;
    } else {
      this.executeCancelExit();
    }
  }

  executeCancelExit() {
    this.router.navigate(['/logistics/dispatches']);
  }

  onSave() {
    if (!this.isFormValid) {
      this.dispatchForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, selecciona origen, destino y añade al menos un producto.'
      });
      return;
    }

    this.saving.set(true);
    const formValue = this.dispatchForm.value;
    
    const dateObj = formValue.date instanceof Date ? formValue.date : new Date(formValue.date);
    const formattedDate = dateObj.toISOString().split('T')[0];

    const payload: RouteDispatch = {
      date: formattedDate,
      originBranchId: formValue.originBranchId,
      branchId: formValue.branchId,
      notes: formValue.notes,
      items: this.items.controls.map(itemGroup => ({
        productId: itemGroup.get('productId')?.value,
        sentQuantity: Number(itemGroup.get('sentQuantity')?.value)
      }))
    };

    this.logisticsService.createRouteDispatch(payload).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Éxito', 
          detail: 'Despacho de ruta creado correctamente' 
        });
        setTimeout(() => this.router.navigate(['/logistics/dispatches']), 1200);
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
