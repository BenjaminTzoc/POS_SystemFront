import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SuppliersService } from '../../services/suppliers.service';
import { TextareaModule } from 'primeng/textarea';
import { Supplier } from '../../interfaces/supplier.interface';

@Component({
  selector: 'app-supplier-form',
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, TextareaModule],
  templateUrl: './supplier-form.component.html',
  styleUrl: './supplier-form.component.css',
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private supplierService = inject(SuppliersService);
  private route = inject(ActivatedRoute);

  searchingNit = false;
  supplierId: string | null = null;
  selectedSupplier: Supplier | null = null; //SOLO PARA EDICION
  isEditMode: boolean = false;
  supplierForm!: FormGroup;

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.supplierId;
    this.initializeForm();

    if (this.isEditMode) {
      this.loadSupplier(this.supplierId!);
    }
  }

  loadSupplier(id: string): void {
    this.supplierService.getSupplier(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.selectedSupplier = res.data;
          this.supplierForm.patchValue(this.selectedSupplier);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo cargar el proveedor: ${err.error?.message || err.message}`,
        });
      },
    });
  }

  searchByNit(): void {
    const nit = this.supplierForm.get('nit')?.value;
    if (!nit) return;

    this.searchingNit = true;
    this.supplierService.getSupplierByNit(nit).subscribe({
      next: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.messageService.add({
            severity: 'info',
            summary: 'Encontrado',
            detail: 'Se encontró un proveedor con este NIT.',
          });
          this.supplierForm.patchValue(res.data);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.messageService.add({
            severity: 'warn',
            summary: 'No encontrado',
            detail: 'No hay proveedores registrados con este NIT.',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al buscar por NIT.',
          });
        }
      },
      complete: () => {
        this.searchingNit = false;
      },
    });
  }

  initializeForm(): void {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required]],
      nit: [''],
      contactName: ['', [Validators.required]],
      email: [''],
      phone: ['', [Validators.required]],
      address: [''],
      accountNumber: [''],
      notes: [''],
    });
  }

  onCancelProccess(): void {
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
        this.router.navigate(['purchases/suppliers']);
      },
    });
  }

  onSaveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    const body = this.supplierForm.value;
    const request = !this.isEditMode
      ? this.supplierService.createSupplier(body)
      : this.supplierService.editSupplier(this.selectedSupplier!.id, body);

    request.subscribe({
      next: (res) => {
        if (this.isEditMode ? res.statusCode === 200 : res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El proveedor se ha ${this.isEditMode ? 'modificado' : 'creado'} correctamente.`,
          });
          this.router.navigate(['/purchases/suppliers']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error ${this.isEditMode ? 'modificando' : 'creando'} el proveedor: ${err.error.message}`,
        });
      },
      complete: () => {},
    });
  }
}
