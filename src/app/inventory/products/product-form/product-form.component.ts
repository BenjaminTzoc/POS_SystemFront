import { Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { RadioButton } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FileUploadModule, FileUpload } from 'primeng/fileupload';
import { MessageModule } from 'primeng/message';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Category, Product, ProductType } from '../../interfaces/product.interface';
import { Branch } from '../../interfaces/branch.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { UnitMeasure } from '../../interfaces/unit.interface';
import { ProductsService } from '../../services/products.service';
import { BranchesService } from '../../services/branches.service';
import { UnitsService } from '../../services/units.service';

@Component({
  selector: 'app-product-form',
  imports: [
    InputText,
    FormsModule,
    Select,
    TextareaModule,
    InputNumberModule,
    RadioButton,
    ButtonModule,
    ReactiveFormsModule,
    FileUploadModule,
    MessageModule,
    ToggleSwitchModule,
    CommonModule,
    TooltipModule,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css',
})
export class ProductFormComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  private branchesService = inject(BranchesService);
  private unitsService = inject(UnitsService);
  private productsService = inject(ProductsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private route = inject(ActivatedRoute);

  @ViewChild('nameInput') nameInput!: ElementRef;
  productForm!: FormGroup;
  categories: Category[] = [];
  units: UnitMeasure[] = [];
  selectedCategory: Category | undefined;
  selectedUnit: UnitMeasure | undefined;
  branches = signal<Branch[]>([]);
  parentProducts = signal<Product[]>([]);
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

  productTypes: any[] = [
    { name: 'Materia Prima', value: ProductType.RAW_MATERIAL },
    { name: 'Insumo', value: ProductType.INSUMO },
    { name: 'Componente (Corte)', value: ProductType.COMPONENT },
    { name: 'Producto Terminado', value: ProductType.FINISHED_PRODUCT },
  ];

  // -----------EDICION-----------
  productId: string | null = null;
  isEditMode: boolean = false;
  currentImageUrl: string | null = null;
  objectUrl: string | null = null;
  isSaving: boolean = false;
  isImageRemoved: boolean = false;
  isGeneratingSku = signal(false);
  
  // Custom flags for variant creation
  isCreatingVariantFromList = false;
  isVariant = false;

  get parentName(): string {
    const parentId = this.productForm?.get('parentId')?.value;
    if (!parentId) return 'Desconocido';
    const parent = this.parentProducts().find((p) => p.id === parentId);
    return parent ? parent.name : 'Cargando información...';
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.productId;

    this.loadCategories();
    this.loadBranches();
    this.loadUnits();
    this.loadParents();
    this.initForm();

    this.productForm.get('manageStock')!.valueChanges.subscribe((value) => {
      this.onManageStockChange(value);
    });

    if (this.isEditMode) {
      this.loadProduct(this.productId!);
    } else {
      // Check if we're creating a variant from the list
      const queryParentId = this.route.snapshot.queryParamMap.get('parentId');
      if (queryParentId) {
        this.isCreatingVariantFromList = true;
        this.isVariant = true;
        this.productForm.get('parentId')?.setValue(queryParentId);
        // isMasterProduct will stay false (default)
      }

      // Focus name input when creating a new product
      setTimeout(() => {
        this.nameInput?.nativeElement?.focus();
      }, 300);
    }

    // Dynamic cost/price logic
    this.productForm.get('type')?.valueChanges.subscribe((type) => {
      this.onTypeChange(type);
    });

    this.productForm.get('isMasterProduct')?.valueChanges.subscribe(isMaster => {
      if (isMaster) {
        this.productForm.get('cost')?.setValue(0);
        this.productForm.get('price')?.setValue(0);
        this.productForm.get('price')?.clearValidators();
        this.productForm.get('price')?.updateValueAndValidity();
        this.productForm.get('manageStock')?.setValue(false);
        this.productForm.get('manageStock')?.disable();
        this.productForm.get('stockAvailability')?.setValue('out_of_stock');
        this.productForm.get('stockAvailability')?.disable();
        this.productForm.get('parentId')?.setValue(null);
        this.productForm.get('unitId')?.clearValidators();
        this.productForm.get('unitId')?.updateValueAndValidity();
      } else {
        if (!this.isEditMode) {
          this.productForm.get('manageStock')?.enable();
        }
        this.productForm.get('stockAvailability')?.enable();
        this.productForm.get('price')?.setValidators([Validators.required, Validators.min(0.01)]);
        this.productForm.get('price')?.updateValueAndValidity();
        this.productForm.get('unitId')?.setValidators([Validators.required]);
        this.productForm.get('unitId')?.updateValueAndValidity();
      }
    });

    this.productForm.get('parentId')?.valueChanges.subscribe(parentId => {
      // Solo auto-completar si estamos creando (no en edición) y hay un padre seleccionado
      if (!this.isEditMode && parentId) {
        const parent = this.parentProducts().find(p => p.id === parentId);
        if (parent) {
          if (parent.name) {
            const currentName = this.productForm.get('name')?.value || '';
            // Solo autocompletar nombre si está vacío para no sobreescribir si el usuario ya escribió algo específico
            if (!currentName) {
              this.productForm.get('name')?.setValue(`${parent.name} - `);
              // Focus al input de nombre para que el usuario pueda escribir la distinción de inmediato
              setTimeout(() => {
                this.nameInput.nativeElement.focus();
              }, 100);
            }
          }
          if (parent.category) {
            // Usamos setTimeout para asegurar que PrimeNG procese la selección
            setTimeout(() => {
              this.productForm.get('categoryId')?.setValue(parent.category?.id);
              this.selectedCategory = parent.category;
            }, 0);
          }
          if (parent.type) {
            this.productForm.get('type')?.setValue(parent.type);
            this.productForm.get('type')?.disable(); // Bloqueamos el tipo por defecto
          }
          if (parent.unit) {
            this.productForm.get('unitId')?.setValue(parent.unit.id);
            this.selectedUnit = parent.unit;
          }
        }
      }
      
      // Manejo de habilitación para variantes nuevas
      if (!this.isEditMode) {
        if (!parentId) {
          this.productForm.get('categoryId')?.enable();
          this.productForm.get('type')?.enable();
          this.productForm.get('unitId')?.enable();
        } else {
          // Siempre dejamos la categoría editable para variantes (por si el usuario quiere cambiarla)
          this.productForm.get('categoryId')?.enable();
          // El tipo sí se queda bloqueado si hay un padre
        }
      }
    });

    this.productForm.get('cost')?.valueChanges.subscribe((cost) => {
      const type = this.productForm.get('type')?.value;
      if (type === ProductType.RAW_MATERIAL || type === ProductType.INSUMO) {
        this.productForm.get('price')?.setValue(cost, { emitEvent: false });
      }
    });
  }

  onGenerateSku() {
    const name = this.productForm.get('name')?.value;
    const categoryId = this.productForm.get('categoryId')?.value;
    const type = this.productForm.get('type')?.value;

    if (!name || name.length < 3) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe ingresar un nombre de producto (mínimo 3 letras) para generar un SKU.',
      });
      return;
    }

    this.isGeneratingSku.set(true);
    this.productsService.suggestSku(categoryId || undefined, type || undefined, name).subscribe({
      next: (response) => {
        this.productForm.get('sku')?.setValue(response.data.sku);
        this.messageService.add({
          severity: 'info',
          summary: 'SKU Generado',
          detail: `Se ha generado el código: ${response.data.sku}`,
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo generar el SKU automáticamente.',
        });
      },
      complete: () => this.isGeneratingSku.set(false),
    });
  }

  onTypeChange(type: ProductType): void {
    const costControl = this.productForm.get('cost');
    if (type === ProductType.COMPONENT) {
      costControl?.setValue(0);
      costControl?.disable();
    } else {
      costControl?.enable();
      // If switching to raw/insumo, sync current cost to price
      if (type === ProductType.RAW_MATERIAL || type === ProductType.INSUMO) {
        this.productForm.get('price')?.setValue(costControl?.value, { emitEvent: false });
      }
    }
  }

  createInitialStockForm(stock: any): FormGroup {
    return this.fb.group({
      id: [stock.id, Validators.required],
      branchId: [{ value: stock.branchId || stock.branch?.id, disabled: this.isEditMode }, Validators.required],
      quantity: [
        { value: stock.stock, disabled: this.isEditMode },
        [Validators.required, Validators.min(0)],
      ],
    });
  }

  loadProduct(productId: string): void {
    this.productsService.getProduct(productId).subscribe({
      next: (response) => {
        this.productForm.patchValue(response.data);

        if (response.data.category) {
          this.productForm.get('categoryId')?.setValue(response.data.category.id);
          this.selectedCategory = response.data.category;
        }

        if (response.data.unit) {
          this.productForm.get('unitId')?.setValue(response.data.unit.id);
          this.selectedUnit = response.data.unit;
        }

        // Bloquear manageStock en modo edición para mantener consistencia
        this.productForm.get('manageStock')?.disable();

        this.initialStocks.clear();
        response.data.inventories?.forEach((inv) => {
          this.initialStocks.push(this.createInitialStockForm(inv));
        });

        if (response.data.imageUrl) {
          this.currentImageUrl = this.getProductImageUrl(response.data.imageUrl);
        }

        const productData = response.data;
        const priceVal = parseFloat(productData.price) || 0;

        // Reglas de edición según la Guía Frontend
        
        // 1. Es una Variante (Presentación de un Maestro)
        if (productData.isVariant) {
          this.isVariant = true;
          this.productForm.get('isMasterProduct')?.setValue(false);
          this.productForm.get('parentId')?.setValue(productData.parentId);
          // Bloquear campos para que no cambie de padre ni modifique categorías
          this.productForm.get('parentId')?.disable();
          this.productForm.get('categoryId')?.disable();
          this.productForm.get('type')?.disable();
        } 
        // 2. Es un Maestro (Familia de productos)
        else if (productData.isMaster) {
          this.isVariant = false;
          this.productForm.get('isMasterProduct')?.setValue(true);
          // Bloquear el toggle para evitar dejar variantes huérfanas
          this.productForm.get('isMasterProduct')?.disable();
        } 
        // 3. Es un Producto Normal (Independiente)
        else {
          this.isVariant = false;
          this.productForm.get('isMasterProduct')?.setValue(false);
          this.productForm.get('parentId')?.setValue(null);
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando el producto: ${error.error.message}`,
        });
      },
    });
  }

  onManageStockChange(value: boolean) {
    if (!value) {
      this.productForm.get('initialStocks')?.reset();
    }
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      isMasterProduct: [false],
      parentId: [null],
      description: [''],
      sku: ['', [Validators.maxLength(50)]],
      barcode: ['', [Validators.maxLength(100)]],
      cost: [0, [Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      type: [ProductType.FINISHED_PRODUCT, [Validators.required]],
      categoryId: [null],
      unitId: [null, [Validators.required]],
      manageStock: [true, Validators.required],
      stockAvailability: ['in_stock', Validators.required],
      isActive: [true, Validators.required],
      isVisible: [true, Validators.required],
      initialStocks: this.fb.array([]),
    });
  }

  loadBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: (response) => {
        this.branches.set(response.data);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las sucursales: ${error.error.message}`,
        });
      },
    });
  }

  loadParents(): void {
    // Usamos el nuevo parámetro isMaster=true para traer solo familias del backend
    this.productsService.getProducts(undefined, false, undefined, undefined, true).subscribe({
      next: (response) => {
        this.parentProducts.set(response.data);
        
        // Si estamos creando una variante desde la lista y ya cargamos los padres, 
        // heredamos la configuración del padre
        if (this.isCreatingVariantFromList && !this.isEditMode) {
          const parentId = this.route.snapshot.queryParamMap.get('parentId');
          const parent = response.data.find((p: Product) => p.id === parentId);
          if (parent) {
            // Heredamos Nombre con guion
            this.productForm.get('name')?.setValue(`${parent.name} - `);
            
            // Heredamos Categoría
            if (parent.category?.id) {
              this.productForm.get('categoryId')?.setValue(parent.category.id);
              this.onCategoryChange({ value: parent.category.id });
            }

            // Heredamos Tipo de Producto
            if (parent.type) {
              this.productForm.get('type')?.setValue(parent.type);
            }

            // Heredamos Unidad de Medida (después de la categoría para que no se resetee)
            if (parent.unit?.id) {
              this.productForm.get('unitId')?.setValue(parent.unit.id);
              this.onUnitChange({ value: parent.unit.id });
            }
          }
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando los productos maestros: ${error?.error?.message}`,
        });
      },
    });
  }

  loadUnits(): void {
    this.unitsService.getUnits().subscribe({
      next: (response) => {
        this.units = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las unidades: ${error.error.message}`,
        });
      },
    });
  }

  loadCategories(): void {
    this.productsService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando las categorías: ${error.error.message}`,
        });
      },
    });
  }

  onSaveProduct(): void {
    this.productForm.markAllAsTouched();
    console.log(this.productForm.value);

    if (this.productForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const formData = this.createFormData();
    this.isSaving = true;

    if (this.isEditMode) {
      this.productsService.updateProduct(this.productId!, formData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El producto se ha actualizado correctamente.`,
          });
          this.router.navigate(['/inventory/products']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error actualizando el producto: ${error.error.message}`,
          });
          this.isSaving = false;
        },
        complete: () => (this.isSaving = false),
      });
    } else {
      this.productsService.createProduct(formData).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El producto se ha creado correctamente.`,
          });
          this.router.navigate(['/inventory/products']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error creando el producto: ${error.error.message}`,
          });
          this.isSaving = false;
        },
        complete: () => (this.isSaving = false),
      });
    }
  }

  private createFormData(): FormData {
    const formData = new FormData();
    const formValue = this.productForm.getRawValue();

    // Agregar CADA CAMPO individualmente al FormData
    Object.keys(formValue).forEach((key) => {
      // Excluir 'id' e 'initialStocks', 'isMasterProduct' cuando es actualización
      if (this.isEditMode && (key === 'id' || key === 'initialStocks' || key === 'isMasterProduct')) {
        return; // Saltar estos campos en modo edición
      }

      if (key === 'isMasterProduct' || key === 'isVariant' || key === 'parentId') {
        return; // Procesados debajo
      }

      if (key === 'sku' && !this.isEditMode && !formValue[key]) {
        return; // No enviar SKU si está vacío en creación (el server lo generará)
      }

      if (key === 'initialStocks') {
        formValue[key].forEach((stock: any, index: number) => {
          formData.append(`initialStocks[${index}][branchId]`, stock.branchId);
          formData.append(`initialStocks[${index}][quantity]`, stock.quantity.toString());
        });
      } else {
        // Enviar solo si no es null para evitar enviar el string "null"
        if (formValue[key] !== null && formValue[key] !== undefined) {
          formData.append(key, formValue[key]);
        }
      }
    });

    const isMaster = formValue['isMasterProduct'] === true;
    const parentId = formValue['parentId'];

    if (parentId) {
      formData.append('isVariant', 'true');
      formData.append('parentId', parentId);
      formData.append('isMaster', 'false');
    } else {
      formData.append('isVariant', 'false');
      formData.append('isMaster', String(isMaster));
    }

    // Agregar imagen
    if (this.uploadedFiles.length > 0) {
      this.uploadedFiles.forEach((file) => {
        formData.append('image', file, file.name);
      });
    } else if (this.isEditMode && this.isImageRemoved) {
      // Enviamos imageUrl vacío para indicar remoción al backend
      formData.append('imageUrl', ''); 
    }

    return formData;
  }

  get initialStocks(): FormArray {
    return this.productForm.get('initialStocks') as FormArray;
  }

  getSelectedBranchIds(): string[] {
    return this.initialStocks.controls
      .map((control) => control.get('branchId')?.value)
      .filter((branchId) => branchId !== null && branchId !== '');
  }

  getAvailableBranchesForIndex(index: number): Branch[] {
    const currentBranchId = this.initialStocks.at(index)?.get('branchId')?.value;
    const selectedBranchId = this.getSelectedBranchIds().filter((id) => id !== currentBranchId);
    const branches = this.branches();

    const filtered = branches.filter(
      (branch) => !selectedBranchId.includes(branch.id) || branch.id === currentBranchId,
    );

    return filtered;
  }

  addStock() {
    if (this.initialStocks.invalid) {
      this.initialStocks.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Información incompleta',
        detail: 'Debe seleccionar una sucursal y asignar un stock inicial antes de agregar otra.',
      });
      return;
    }

    if (!this.selectedUnit) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: `Debe seleccionar una unidad de medida.`,
      });
      return;
    }

    const newStockGroup = this.fb.group({
      id: [this.generateUniqueId()],
      branchId: [null, Validators.required],
      quantity: [null, [Validators.required, Validators.min(0)]],
    });

    this.initialStocks.push(newStockGroup);
  }

  removeStock(index: number) {
    this.initialStocks.removeAt(index);
  }

  onCategoryChange(event: any) {
    const selectedId = event.value;
    // No reseteamos si ya tenemos una unidad (caso de variantes que heredaron unidad)
    if (!this.selectedUnit) {
      this.productForm.get('unitId')?.reset();
      this.initialStocks.clear();
    }
    
    if (!selectedId) return;

    this.productsService.getCategory(selectedId).subscribe({
      next: (response) => {
        const unitMeasure = response.data.defaultUnit;

        if (unitMeasure) {
          this.productForm.get('unitId')?.setValue(unitMeasure?.id);
          this.onUnitChange({ value: unitMeasure.id });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando la categoría: ${error.error.message}`,
        });
      },
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error cargando la unidad de medida: ${error.error.message}`,
        });
      },
    });
  }

  onUpload(event: any) {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
    this.uploadedFiles = event.currentFiles;
    if (this.uploadedFiles.length > 0) {
      const file = this.uploadedFiles[0];
      this.objectUrl = URL.createObjectURL(file);
    }
  }

  onRemoveUploadedFile() {
    this.uploadedFiles = [];
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (this.fileUpload) {
        this.fileUpload.clear();
    }
  }

  changeImage() {
    this.currentImageUrl = null;
    this.isImageRemoved = true;
    this.onRemoveUploadedFile();
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
        this.router.navigate(['inventory/products']);
      },
    });
  }

  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getProductImageUrl(imageUrl: string | null): string {
    if (!imageUrl) {
      return `${environment.baseUrl}/uploads/products/default-product.png`;
    }

    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    return `${environment.baseUrl}${imageUrl}`;
  }
}
