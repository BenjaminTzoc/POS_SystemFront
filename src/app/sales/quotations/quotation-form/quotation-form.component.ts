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
import { TableModule } from 'primeng/table';

import { ProductsService } from '../../../inventory/services/products.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { CustomersService } from '../../services/customers.service';
import { QuotationsService } from '../../services/quotations.service';
import { Product } from '../../../inventory/interfaces/product.interface';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Select,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    TableModule,
  ],
  templateUrl: './quotation-form.component.html',
  styleUrl: './quotation-form.component.css',
})
export class QuotationFormComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly branchesService = inject(BranchesService);
  private readonly customersService = inject(CustomersService);
  private readonly quotationsService = inject(QuotationsService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  quotationForm: FormGroup;
  products: Product[] = [];
  branches: Branch[] = [];
  customers: ICustomer[] = [];
  loading = false;

  subtotal = 0;
  tax = 0;
  total = 0;

  constructor() {
    this.quotationForm = this.fb.group({
      customerId: [null, [Validators.required]],
      branchId: [null, [Validators.required]],
      validityDays: [15, [Validators.required, Validators.min(1)]],
      notes: [null],
      items: this.fb.array([], [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadBranches();
    this.loadCustomers();
    this.addItem();

    // Auto-calculate totals on change
    this.quotationForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });
  }

  get items() {
    return this.quotationForm.get('items') as FormArray;
  }

  loadProducts() {
    this.productsService.getProducts().subscribe({
      next: (res: ApiResponse<Product[]>) => (this.products = res.data),
    });
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res: ApiResponse<Branch[]>) => (this.branches = res.data),
    });
  }

  loadCustomers() {
    this.customersService.getCustomers().subscribe({
      next: (res: ApiResponse<ICustomer[]>) => (this.customers = res.data),
    });
  }

  addItem() {
    const itemGroup = this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      lineTotal: [0],
    });

    itemGroup.get('productId')?.valueChanges.subscribe((id) => {
      const product = this.products.find((p) => p.id === id);
      if (product) {
        itemGroup.patchValue({ unitPrice: Number(product.price) }, { emitEvent: true });
      }
    });

    this.items.push(itemGroup);
  }

  removeItem(index: number) {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  calculateTotals() {
    let rawSubtotal = 0;
    this.items.controls.forEach((group) => {
      const qty = group.get('quantity')?.value || 0;
      const price = group.get('unitPrice')?.value || 0;
      const lineTotal = qty * price;
      group.get('lineTotal')?.setValue(lineTotal, { emitEvent: false });
      rawSubtotal += lineTotal;
    });

    this.subtotal = rawSubtotal;
    const IVA_RATE = 0.12;
    // Assuming prices in system are BEFORE tax or TOTAL?
    // Usually in POS systems prices are TOTAL. Let's assume subtotal is base.
    this.tax = this.subtotal * IVA_RATE;
    this.total = this.subtotal + this.tax;
  }

  onSave() {
    if (this.quotationForm.invalid) {
      this.quotationForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const body = this.quotationForm.value;

    this.quotationsService.createQuotation(body).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Cotización creada correctamente.',
        });
        this.router.navigate(['/sales/quotations']);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message || 'Error al guardar.',
        });
      },
    });
  }

  onCancel() {
    this.router.navigate(['/sales/quotations']);
  }

  getProductImageUrl(imageUrl?: string): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
