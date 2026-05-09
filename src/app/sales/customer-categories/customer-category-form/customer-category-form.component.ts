import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CustomerCategoriesService } from '../../services/customer-categories.service';
import { ICustomerCategory } from '../../interfaces/customer.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    ButtonModule,
    ToggleSwitchModule,
  ],
  templateUrl: './customer-category-form.component.html',
})
export class CustomerCategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private categoriesService = inject(CustomerCategoriesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  categoryForm!: FormGroup;
  isEditMode = false;
  categoryId: string | null = null;
  isSaving = false;

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;
    this.initForm();

    if (this.isEditMode) {
      this.loadCategory();
    }
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(255)]],
      discountPercentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      minPurchaseAmount: [0, [Validators.required, Validators.min(0)]],
      defaultCreditLimit: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });
  }

  private loadCategory(): void {
    if (!this.categoryId) return;

    this.categoriesService.getCategoryById(this.categoryId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          const category = res.data;
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description,
            discountPercentage: category.discountPercentage,
            minPurchaseAmount: category.minPurchaseAmount,
            defaultCreditLimit: category.defaultCreditLimit,
            isActive: category.isActive,
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la categoría',
        });
        this.router.navigate(['/sales/customer-categories']);
      },
    });
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const values = this.categoryForm.value;

    const request = this.isEditMode
      ? this.categoriesService.updateCategory(this.categoryId!, values)
      : this.categoriesService.createCategory(values);

    request.subscribe({
      next: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Categoría ${this.isEditMode ? 'actualizada' : 'creada'} correctamente`,
          });
          this.router.navigate(['/sales/customer-categories']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error.message || 'Error al procesar la solicitud',
        });
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    if (this.categoryForm.dirty) {
      this.confirmationService.confirm({
        message: 'Tiene cambios sin guardar. ¿Desea salir?',
        header: 'Confirmar salida',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Si, salir',
        rejectLabel: 'No, quedar',
        accept: () => this.router.navigate(['/sales/customer-categories']),
      });
    } else {
      this.router.navigate(['/sales/customer-categories']);
    }
  }
}
