import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';

import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { InventoryTransfersService } from '../../services/inventory-transfers.service';
import { Product } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { UpdateInventoryTransferDto } from '../../interfaces/inventory-transfer.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Select,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    TableModule,
    InputGroup,
    InputGroupAddon,
  ],
  templateUrl: './transfer-form.component.html',
  styleUrl: './transfer-form.component.css',
})
export class TransferFormComponent implements OnInit {
  @ViewChild('ribbonContainer') ribbonContainer?: ElementRef<HTMLDivElement>;

  private readonly productsService = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly transfersService = inject(InventoryTransfersService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  transferForm: FormGroup;
  products: any[] = [];
  branches: Branch[] = [];
  loading = false;
  isLoadingProducts = false;
  productSearchTerm: string = '';
  quickQuantities: { [productId: string]: number } = {};

  isEditMode = false;
  transferId: string | null = null;
  transferNumber: string = '';

  get destinationBranches(): Branch[] {
    const originId = this.transferForm.get('originBranchId')?.value;
    if (!originId) return this.branches;
    return this.branches.filter((b) => b.id !== originId);
  }

  get selectedOriginBranch(): Branch | undefined {
    const id = this.transferForm.get('originBranchId')?.value;
    return this.branches.find((b) => b.id === id);
  }

  get selectedDestinationBranch(): Branch | undefined {
    const id = this.transferForm.get('destinationBranchId')?.value;
    return this.branches.find((b) => b.id === id);
  }

  get totalUnitsCount(): number {
    return this.items.controls.reduce(
      (acc, ctrl) => acc + (Number(ctrl.get('quantity')?.value) || 0),
      0
    );
  }

  get totalEstimatedValue(): number {
    return this.items.controls.reduce((acc, ctrl) => {
      const qty = Number(ctrl.get('quantity')?.value) || 0;
      const price = Number(ctrl.get('price')?.value) || 0;
      return acc + qty * price;
    }, 0);
  }

  get filteredRibbonProducts(): any[] {
    if (!this.productSearchTerm.trim()) {
      return this.products;
    }
    const term = this.productSearchTerm.trim().toLowerCase();
    return this.products.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.sku?.toLowerCase().includes(term)
    );
  }

  constructor() {
    this.transferForm = this.fb.group({
      originBranchId: [null, [Validators.required]],
      destinationBranchId: [null, [Validators.required]],
      notes: [null],
      items: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadBranches();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.transferId = id;
      this.loadTransferForEdit(id);
    }
  }

  loadTransferForEdit(id: string): void {
    this.loading = true;
    this.transfersService.getTransferById(id).subscribe({
      next: (res) => {
        const transfer = res.data;
        this.transferNumber = transfer.transferNumber;

        this.transferForm.patchValue({
          originBranchId: transfer.originBranchId,
          destinationBranchId: transfer.destinationBranchId,
          notes: transfer.notes || null,
        });

        // Cargar catálogo de la sucursal de origen
        if (transfer.originBranchId) {
          this.isLoadingProducts = true;
          this.productsService.getBranchCatalog(transfer.originBranchId, false, true, true).subscribe({
            next: (catalogRes) => {
              this.products = (catalogRes.data as any[]) || [];
              this.isLoadingProducts = false;
              this.populateItems(transfer.items || []);
              this.loading = false;
            },
            error: (err) => {
              this.isLoadingProducts = false;
              this.loading = false;
              this.populateItems(transfer.items || []);
              this.showError('Error cargando catálogo', err);
            },
          });
        } else {
          this.populateItems(transfer.items || []);
          this.loading = false;
        }
      },
      error: (err) => {
        this.loading = false;
        this.showError('Error al cargar datos del traslado', err);
        this.router.navigate(['/inventory/inventory-transfers']);
      },
    });
  }

  private populateItems(items: any[]): void {
    this.items.clear();
    items.forEach((item) => {
      const catalogProduct = this.products.find((p) => p.id === item.productId);
      const maxStock = catalogProduct?.stock ?? (item.product?.stock ?? (Number(item.quantity) || 0));

      const itemGroup = this.fb.group({
        productId: [item.productId, [Validators.required]],
        name: [item.productName || catalogProduct?.name || item.product?.name || ''],
        sku: [item.sku || catalogProduct?.sku || ''],
        imageUrl: [item.imageUrl || catalogProduct?.imageUrl || ''],
        price: [item.price || catalogProduct?.price || 0],
        quantity: [Number(item.quantity) || 1, [Validators.required, Validators.min(0.01)]],
        maxStock: [maxStock],
        unitAbbreviation: [item.unitAbbreviation || catalogProduct?.unitAbbreviation || ''],
        allowsDecimals: [catalogProduct?.allowsDecimals ?? item.product?.allowsDecimals ?? false],
      });

      itemGroup.get('productId')?.valueChanges.subscribe((prodId: string | null) => {
        if (prodId) {
          this.updateItemStock(itemGroup, prodId);
        }
      });

      this.items.push(itemGroup);
    });
  }

  get items() {
    return this.transferForm.get('items') as FormArray;
  }

  getQuickQuantity(productId: string): number {
    return this.quickQuantities[productId] !== undefined ? this.quickQuantities[productId] : 1;
  }

  setQuickQuantity(productId: string, value: any): void {
    const val = Number(value);
    this.quickQuantities[productId] = isNaN(val) || val <= 0 ? 1 : val;
  }

  onQuickQuantityChange(productId: string, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.setQuickQuantity(productId, val);
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

  toggleProduct(product: any): void {
    const qty = this.getQuickQuantity(product.id);
    this.addProductToTransfer(product, qty);
  }

  clearAllItems(): void {
    this.items.clear();
  }

  addProductToTransfer(product: any, initialQuantity: number = 1): void {
    const maxStock = product.stock || 0;
    const safeQty = Math.min(initialQuantity, maxStock > 0 ? maxStock : initialQuantity);

    // Si ya existe en la lista, aumentamos la cantidad
    const existingIndex = this.items.controls.findIndex((ctrl) => ctrl.get('productId')?.value === product.id);
    if (existingIndex > -1) {
      const existingGroup = this.items.at(existingIndex) as FormGroup;
      const currentQty = Number(existingGroup.get('quantity')?.value) || 0;
      const nextQty = Math.min(currentQty + safeQty, maxStock);
      existingGroup.get('quantity')?.setValue(Number(nextQty.toFixed(2)));
      this.quickQuantities[product.id] = 1;
      return;
    }

    const itemGroup = this.fb.group({
      productId: [product.id, [Validators.required]],
      name: [product.name || ''],
      sku: [product.sku || ''],
      imageUrl: [product.imageUrl || ''],
      price: [product.price || 0],
      quantity: [safeQty > 0 ? safeQty : 1, [Validators.required, Validators.min(0.01)]],
      maxStock: [maxStock],
      unitAbbreviation: [product.unitAbbreviation || ''],
      allowsDecimals: [product.allowsDecimals ?? false],
    });

    itemGroup.get('productId')?.valueChanges.subscribe((prodId: string | null) => {
      if (prodId) {
        this.updateItemStock(itemGroup, prodId);
      }
    });

    this.items.push(itemGroup);
    this.quickQuantities[product.id] = 1;
  }

  loadBranchCatalog(branchId: string) {
    this.isLoadingProducts = true;
    this.productsService.getBranchCatalog(branchId, false, true, true).subscribe({
      next: (res) => {
        this.products = res.data as any[];
        this.isLoadingProducts = false;
      },
      error: (err) => {
        this.isLoadingProducts = false;
        this.showError('Error cargando catálogo de sucursal', err);
      },
    });
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res) => (this.branches = res.data),
      error: (err) => this.showError('Error cargando sucursales', err),
    });
  }

  addItem() {
    const itemGroup = this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      maxStock: [null], // Helper for UI validation
      unitAbbreviation: [''], // NEW: For showing the unit
    });

    // Watch for product changes to update maxStock (optional but helpful)
    itemGroup.get('productId')?.valueChanges.subscribe((prodId: string | null) => {
      if (prodId) {
        this.updateItemStock(itemGroup, prodId);
      }
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    this.items.removeAt(index);
  }

  updateItemStock(group: FormGroup, productId: string) {
    if (!productId) return;

    const product = this.products.find((p: any) => p.id === productId) as any;
    if (product) {
        group.get('unitAbbreviation')?.setValue(product.unitAbbreviation || '');
        group.get('maxStock')?.setValue(product.stock || 0);
    }
  }

  onOriginChange() {
    const originId = this.transferForm.get('originBranchId')?.value;
    
    if (originId) {
      this.loadBranchCatalog(originId);
    } else {
      this.products = [];
    }

    // Re-validate all items stock when origin branch changes
    this.items.controls.forEach((group) => {
      const productId = group.get('productId')?.value;
      if (productId) {
        this.updateItemStock(group as FormGroup, productId);
      }
    });

    // Prevent same origin and destination
    if (
      originId === this.transferForm.get('destinationBranchId')?.value
    ) {
      this.transferForm.get('destinationBranchId')?.setValue(null);
    }
  }

  onSave() {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, completa todos los campos requeridos.',
      });
      return;
    }

    const { originBranchId, destinationBranchId } = this.transferForm.value;
    if (originBranchId === destinationBranchId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La sucursal de origen y destino no pueden ser la misma.',
      });
      return;
    }

    this.loading = true;
    const rawValue = this.transferForm.value;
    const body = {
      ...rawValue,
      items: rawValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    if (this.isEditMode && this.transferId) {
      const updateDto: UpdateInventoryTransferDto = {
        originBranchId: rawValue.originBranchId,
        destinationBranchId: rawValue.destinationBranchId,
        notes: rawValue.notes,
        items: rawValue.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      this.transfersService.updateTransfer(this.transferId, updateDto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Traslado actualizado',
            detail: 'El traslado se ha modificado exitosamente.',
          });
          this.router.navigate(['/inventory/inventory-transfers']);
        },
        error: (err) => {
          this.loading = false;
          this.showError('Error al actualizar traslado', err);
        },
      });
    } else {
      this.transfersService.createTransfer(body).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Traslado creado',
            detail: 'El traslado se ha registrado exitosamente.',
          });
          this.router.navigate(['/inventory/inventory-transfers']);
        },
        error: (err) => {
          this.loading = false;
          this.showError('Error al crear traslado', err);
        },
      });
    }
  }

  onCancel() {
    this.router.navigate(['/inventory/inventory-transfers']);
  }

  getStockInOrigin(product: any): number {
    return product.stock || 0;
  }

  getAvailableProducts(index: number): any[] {
    const selectedProductIds = this.items.controls
      .map((control, i) => (i !== index ? control.get('productId')?.value : null))
      .filter((id) => id !== null);

    return this.products.filter((p) => !selectedProductIds.includes(p.id));
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  private showError(summary: string, err: any) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail: err.error?.message || 'Ocurrió un error inesperado.',
    });
  }
}
