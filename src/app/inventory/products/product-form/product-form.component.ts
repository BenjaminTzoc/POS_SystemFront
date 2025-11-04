import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { InputText } from "primeng/inputtext";
import { Select } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { RadioButton } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule } from 'primeng/fileupload'
import { Router } from '@angular/router';
import { Category } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { UnitMeasure } from '../../interfaces/unit.interface';
import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { UnitsService } from '../../services/units.service';

@Component({
  selector: 'app-product-form',
  imports: [
    InputText, FormsModule, Select, TextareaModule, InputNumberModule, 
    RadioButton, ButtonModule, ReactiveFormsModule, FileUploadModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit {
  private branchesService = inject(BranchesService);
  private unitsService = inject(UnitsService);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);

  productForm!: FormGroup;
  categories: Category[] = [];
  units: UnitMeasure[] = [];
  selectedCategory: Category | undefined;
  selectedUnit: UnitMeasure | undefined;
  branches = signal<Branch[]>([]);
  uploadedFiles: any[] = [];
  statuses: any[] = [
        { name: 'Inactivo', key: false },
        { name: 'Activo', key: true },
    ];
  visibility: any[] = [
        { name: 'No visible', key: false },
        { name: 'Visible', key: true },
    ];
  manageStock: any[] = [
        { name: 'No', key: false },
        { name: 'Si', key: true },
    ];
  stockAvailability: any[] = [
        { name: 'en stock', key: 'in_stock' },
        { name: 'sin stock', key: 'out_of_stock' },
        // { name: 'stock limitado', key: 'limited' },
    ];

  ngOnInit(): void {
    this.loadCategories();
    this.loadBranches();
    this.loadUnits();
    this.initForm();

    this.productForm.get('manageStock')!.valueChanges.subscribe((value) => {
      this.onManageStockChange(value);
    })
  }

  onManageStockChange(value: boolean) {
    if (!value) {
      this.productForm.get('initialStocks')?.reset();
    }
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      barcode: ['', [Validators.maxLength(100)]],
      cost: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
      categoryId: [null],
      unitId: [null, [Validators.required]],
      manageStock: [true, Validators.required],
      stockAvailability: ['in_stock', Validators.required],
      isActive: [true, Validators.required],
      isVisible: [true, Validators.required],
      initialStocks: this.fb.array([])
    });
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (response) => {
        this.branches.set(response.data);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error cargando las sucursales: ${error.error.message}`});
      }
    })
  }

  loadUnits(): void {
    this.unitsService.getUnits().subscribe({
      next: (response) => {
        this.units = response.data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error cargando las unidades: ${error.error.message}`});
      }
    })
  }

  loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error cargando las categorías: ${error.error.message}`});
      }
    })
  }

  onSaveProduct(): void {
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    const formData = this.createFormData();
    this.productsService.createProduct(formData).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `El producto se ha creado correctamente.`});
        this.router.navigate(['/inventory/products'])
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error creando el producto: ${error.error.message}`});
      }
    })
  }

  private createFormData(): FormData {
    const formData = new FormData();
    const formValue = this.productForm.value;

    // Agregar CADA CAMPO individualmente al FormData
    Object.keys(formValue).forEach(key => {
      if (key === 'initialStocks') {
        formValue[key].forEach((stock: any, index: number) => {
        formData.append(`initialStocks[${index}][branchId]`, stock.branchId);
        formData.append(`initialStocks[${index}][quantity]`, stock.quantity.toString());
      });
      } else {
        formData.append(key, formValue[key]);
      }
    });

    // Agregar imagen
    this.uploadedFiles.forEach((file) => {
      formData.append('image', file, file.name);
    });

    return formData;
  }

  get initialStocks(): FormArray {
    return this.productForm.get('initialStocks') as FormArray;
  }

  getSelectedBranchIds(): string[] {
    return this.initialStocks.controls
      .map(control => control.get('branchId')?.value)
      .filter(branchId => branchId !== null && branchId !== '');
  }

  getAvailableBranchesForIndex(index: number): Branch[] {
    const currentBranchId = this.initialStocks.at(index)?.get('branchId')?.value;
    const selectedBranchId = this.getSelectedBranchIds().filter(id => id !== currentBranchId);
    const branches = this.branches();

    const filtered = branches.filter(branch => 
      !selectedBranchId.includes(branch.id) || branch.id === currentBranchId
    );

    return filtered;
  }

  addStock() {
    if (!this.selectedUnit) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: `Debe seleccionar una unidad de medida.`});
      return;
    }

    const newStockGroup = this.fb.group({
      id: [this.generateUniqueId()],
      branchId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]]
    })

    this.initialStocks.push(newStockGroup);
  }

  removeStock(index: number) {
    this.initialStocks.removeAt(index);
  }

  onCategoryChange(event: any) {
    const selectedId = event.value;
    this.productForm.get('unitId')?.reset();
    this.initialStocks.clear();
    this.selectedUnit = undefined;
    if (!selectedId) return;

    this.productsService.getCategory(selectedId).subscribe({
      next: (response) => {
        const unitMeasure = response.data.defaultUnit;

        if (unitMeasure) {
          this.productForm.get('unitId')?.setValue(unitMeasure?.id)
          this.onUnitChange({value: unitMeasure.id})
        }
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error cargando la categoría: ${error.error.message}`});
      }
    });
  }

  onUnitChange(event: any) {
    const selectedUnitId = event.value;

    if (!selectedUnitId) {
      this.selectedUnit = undefined;
      return;
    }

    this.unitsService.getUnit(selectedUnitId).subscribe({
      next: (response) => {
        this.selectedUnit = response.data;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error cargando la unidad de medida: ${error.error.message}`});
      }
    })
  }

  onUpload(event: any) {
    this.uploadedFiles = event.currentFiles;
  }

  onRemoveFile(index: number) {
    this.uploadedFiles.splice(index, 1);
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
        this.router.navigate(['inventory/products'])
      },
    });
  }

  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
