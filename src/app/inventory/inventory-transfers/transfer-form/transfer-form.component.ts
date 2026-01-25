import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';

import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { InventoryTransfersService } from '../../services/inventory-transfers.service';
import { Product } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Select,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
  ],
  templateUrl: './transfer-form.component.html',
  styleUrl: './transfer-form.component.css',
})
export class TransferFormComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly transfersService = inject(InventoryTransfersService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  transferForm: FormGroup;
  products: Product[] = [];
  branches: Branch[] = [];
  loading = false;

  constructor() {
    this.transferForm = this.fb.group({
      originBranchId: [null, [Validators.required]],
      destinationBranchId: [null, [Validators.required]],
      notes: [null],
      items: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadBranches();
    this.addItem(); // Start with one empty item
  }

  get items() {
    return this.transferForm.get('items') as FormArray;
  }

  loadProducts() {
    this.productsService.getProducts().subscribe({
      next: (res) => (this.products = res.data),
      error: (err) => this.showError('Error cargando productos', err),
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
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  updateItemStock(group: FormGroup, productId: string) {
    const originBranchId = this.transferForm.get('originBranchId')?.value;
    if (!originBranchId || !productId) return;

    const product = this.products.find((p) => p.id === productId);
    if (product?.inventories) {
      const inventory = product.inventories.find((i) => i.branch.id === originBranchId);
      group.get('maxStock')?.setValue(inventory ? inventory.stock : 0);
    }
  }

  onOriginChange() {
    // Re-validate all items stock when origin branch changes
    this.items.controls.forEach((group) => {
      const productId = group.get('productId')?.value;
      if (productId) {
        this.updateItemStock(group as FormGroup, productId);
      }
    });

    // Prevent same origin and destination
    if (
      this.transferForm.get('originBranchId')?.value ===
      this.transferForm.get('destinationBranchId')?.value
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

  onCancel() {
    this.router.navigate(['/inventory/inventory-transfers']);
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
