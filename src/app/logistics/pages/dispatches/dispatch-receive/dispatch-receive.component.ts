import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';

import { TooltipModule } from 'primeng/tooltip';

import { LogisticsService } from '../../../services/logistics.service';
import { RouteDispatch, RouteDispatchItem } from '../../../interfaces/route-dispatch.interface';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-dispatch-receive',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputNumberModule, 
    ToastModule, 
    SkeletonModule,
    TooltipModule
  ],
  providers: [],
  templateUrl: './dispatch-receive.component.html'
})
export class DispatchReceiveComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logisticsService = inject(LogisticsService);
  private messageService = inject(MessageService);

  dispatchId = signal<string | null>(null);
  dispatch = signal<RouteDispatch | null>(null);
  loading = signal(true);
  saving = signal(false);
  receiveForm: FormGroup;

  constructor() {
    this.receiveForm = this.fb.group({
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
    return this.receiveForm.get('items') as FormArray;
  }

  loadDispatch(id: string) {
    this.logisticsService.getRouteDispatch(id).subscribe({
      next: (res: ApiResponse<RouteDispatch>) => {
        this.dispatch.set(res.data);
        this.populateForm(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el despacho' });
        this.router.navigate(['/logistics/dispatches']);
      }
    });
  }

  populateForm(dispatch: RouteDispatch) {
    const itemsArray = this.receiveForm.get('items') as FormArray;
    itemsArray.clear();

    dispatch.items.forEach((item: RouteDispatchItem) => {
      const product = item.product as any;
      itemsArray.push(this.fb.group({
        productId: [product?.id || item.productId],
        productName: [product?.name],
        sku: [product?.sku],
        unitAbbreviation: [product?.unit?.abbreviation],
        imageUrl: [product?.imageUrl],
        allowsDecimals: [product?.unit?.allowsDecimals ?? true],
        sentQuantity: [item.sentQuantity],
        receivedQuantity: [item.sentQuantity, [Validators.required, Validators.min(0)]]
      }));
    });
  }

  getProductImageUrl(url?: string): string {
    if (!url) return `${environment.baseUrl}/uploads/products/default-product.png`;
    return url.startsWith('http') ? url : `${environment.baseUrl}${url}`;
  }

  onCancel() {
    this.router.navigate(['/logistics/dispatches']);
  }

  onSave() {
    if (this.receiveForm.invalid) return;

    this.saving.set(true);
    const formValue = this.receiveForm.value;
    const id = this.dispatchId();

    if (!id) return;

    const body = {
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        receivedQuantity: item.receivedQuantity
      }))
    };

    this.logisticsService.receiveRouteDispatch(id, body).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Recepción confirmada' });
        setTimeout(() => this.router.navigate(['/logistics/dispatches']), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al confirmar recepción' });
      }
    });
  }
}
