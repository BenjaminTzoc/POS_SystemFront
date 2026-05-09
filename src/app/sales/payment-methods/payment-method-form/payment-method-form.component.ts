import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';

// Services
import { PaymentMethodsService } from '../../services/payment-methods.service';

@Component({
  selector: 'app-payment-method-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToggleSwitchModule,
    TextareaModule
  ],
  templateUrl: './payment-method-form.component.html',
})
export class PaymentMethodFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private paymentService = inject(PaymentMethodsService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  paymentForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  methodId: string | null = null;

  constructor() {
    this.paymentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required]],
      description: [''],
      requiresBankAccount: [false]
    });
  }

  ngOnInit(): void {
    this.methodId = this.route.snapshot.paramMap.get('id');
    if (this.methodId) {
      this.isEditMode = true;
      this.loadMethodData(this.methodId);
    }
  }

  loadMethodData(id: string): void {
    this.paymentService.getPaymentMethod(id).subscribe({
      next: (res) => {
        this.paymentForm.patchValue(res.data);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del método de pago' });
        this.router.navigate(['/sales/payment-methods']);
      }
    });
  }

  onSave(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const body = this.paymentForm.value;

    if (this.isEditMode && this.methodId) {
      this.paymentService.updatePaymentMethod(this.methodId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago actualizado correctamente' });
          setTimeout(() => this.router.navigate(['/sales/payment-methods']), 1500);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' });
          this.isSaving = false;
        }
      });
    } else {
      this.paymentService.createPaymentMethod(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago creado correctamente' });
          setTimeout(() => this.router.navigate(['/sales/payment-methods']), 1500);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear' });
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/sales/payment-methods']);
  }
}
