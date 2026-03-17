import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';

import { LogisticsService } from '../../../services/logistics.service';
import { RouteDispatch, RouteDispatchItem } from '../../../interfaces/route-dispatch.interface';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dispatch-liquidate',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputNumberModule, 
    InputTextModule,
    ToastModule, 
    SkeletonModule,
    TooltipModule,
    TagModule
  ],
  providers: [],
  templateUrl: './dispatch-liquidate.component.html',
})
export class DispatchLiquidateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logisticsService = inject(LogisticsService);
  private messageService = inject(MessageService);

  dispatchId = signal<string | null>(null);
  dispatch = signal<RouteDispatch | null>(null);
  loading = signal(true);
  saving = signal(false);
  liquidateForm: FormGroup;

  constructor() {
    this.liquidateForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dispatchId.set(id);
      this.loadDispatch(id);
    }
  }

  get items() {
    return this.liquidateForm.get('items') as FormArray;
  }

  loadDispatch(id: string) {
    this.loading.set(true);
    this.logisticsService.getRouteDispatch(id).subscribe({
      next: (res: ApiResponse<RouteDispatch>) => {
        this.dispatch.set(res.data);
        this.populateForm(res.data);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error de Carga', 
          detail: err.error?.message || 'No se pudo cargar el despacho.' 
        });
        this.router.navigate(['/logistics/dispatches']);
      }
    });
  }

  populateForm(dispatch: RouteDispatch) {
    const itemsArray = this.liquidateForm.get('items') as FormArray;
    itemsArray.clear();

    if (!dispatch.items) return;

    dispatch.items.forEach(item => {
      const product = item.product;
      itemsArray.push(this.fb.group({
        productId: [product?.id || item.productId],
        productName: [product?.name || 'Producto sin nombre'],
        sku: [product?.sku || 'S/N'],
        unitAbbreviation: [product?.unit?.abbreviation || 'und'],
        allowsDecimals: [product?.unit?.allowsDecimals ?? false],
        imageUrl: [product?.imageUrl],
        sentQuantity: [item.sentQuantity || 0],
        receivedQuantity: [item.receivedQuantity || 0],
        soldQuantity: [item.suggestedSoldQuantity || 0, [Validators.required, Validators.min(0)]],
        returnedQuantity: [0, [Validators.required, Validators.min(0)]],
        stayedQuantity: [0, [Validators.required, Validators.min(0)]],
        wasteQuantity: [0, [Validators.required, Validators.min(0)]],
        notes: ['']
      }));
    });
  }

  getProductImageUrl(url?: string): string {
    if (!url) return `${environment.baseUrl}/uploads/products/default-product.png`;
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  calculateDiscrepancy(item: any): number {
    const received = item.get('receivedQuantity')?.value || 0;
    const sold = item.get('soldQuantity')?.value || 0;
    const returned = item.get('returnedQuantity')?.value || 0;
    const stayed = item.get('stayedQuantity')?.value || 0;
    const waste = item.get('wasteQuantity')?.value || 0;
    
    // Formula: Discrepancy = Received - (Sold + Returned + Waste + Stayed)
    return parseFloat((received - (sold + returned + waste + stayed)).toFixed(4));
  }

  onCancel() {
    this.router.navigate(['/logistics/dispatches']);
  }

  onSave() {
    if (this.liquidateForm.invalid) return;

    // Optional Check: Warn about discrepancies
    const hasDiscrepancies = this.items.controls.some(item => this.calculateDiscrepancy(item) !== 0);
    if (hasDiscrepancies) {
        // Here we could show a confirmation dialog. For now, we proceed.
    }

    this.saving.set(true);
    const formValue = this.liquidateForm.value;
    const id = this.dispatchId();

    if (!id) return;

    const body = {
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        soldQuantity: item.soldQuantity,
        returnedQuantity: item.returnedQuantity,
        stayedQuantity: item.stayedQuantity,
        wasteQuantity: item.wasteQuantity,
        notes: item.notes
      }))
    };

    this.logisticsService.liquidateRouteDispatch(id, body).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Liquidación Cerrada', detail: 'El ciclo de ruta ha concluido exitosamente.' });
        setTimeout(() => this.router.navigate(['/logistics/dispatches']), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al liquidar el día' });
      }
    });
  }
}
