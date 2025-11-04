import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { UnitMeasure } from '../../interfaces/unit.interface';
import { UnitsService } from '../../services/units.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { Category } from '../../interfaces/product.interface';

@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule],
  templateUrl: './category-form.component.html',
  styleUrl: './category-form.component.css'
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private unitsService = inject(UnitsService);
  private productsService = inject(ProductsService);
  private route = inject(ActivatedRoute);

  categoryId: string | null = null;
  selectedCategory: Category | null = null; //SOLO PARA EDICION
  isEditMode: boolean = false;
  categoryForm!: FormGroup;
  units: UnitMeasure[] = [];

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.categoryId;
    this.initializeForm();
    this.loadUnits();

    if (this.isEditMode) {
      this.loadCategory(this.categoryId!);
    }
  }

  initializeForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      defaultUnitId: ['']
    })
  }

  loadCategory(id: string): void {
    this.productsService.getCategory(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.selectedCategory = res.data;
          this.categoryForm.get('name')?.setValue(this.selectedCategory.name);
          this.categoryForm.get('description')?.setValue(this.selectedCategory.description);
          this.categoryForm.get('defaultUnitId')?.setValue(this.selectedCategory.defaultUnit?.id);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error obteniendo la categoría: ${err.error.message}`,
        });
      },
    })
  }

  loadUnits(): void {
    this.unitsService.getUnits().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.units = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error cargando las unidades de medida: ${err.error.message}`
        });
      }
    })
  }

  onSaveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    const body = this.categoryForm.value;
    const request = !this.isEditMode ? this.productsService.createCategory(body) : this.productsService.editCategory(this.selectedCategory!.id, body);

    request.subscribe({
      next: (res) => {
        if (this.isEditMode ? res.statusCode === 200 : res.statusCode === 201) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: `La categoría se ha creado correctamente.`
          });
          this.router.navigate(['/inventory/product-categories']);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error creando la categoría: ${err.error.message}`,
        });
      }
    })
  }

  onCancelProccess() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de cancelar este proceso?',
      header: 'Confirmar cancelación',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Regresar',
      rejectButtonProps: {
        label: 'Regresar',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Cancelar proceso',
        severity: 'danger',
      },

      accept: () => {
        this.router.navigate(['inventory/product-categories'])
      },
    });
  }
}
