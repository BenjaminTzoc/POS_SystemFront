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
  styleUrl: './supplier-form.component.css'
})
export class SupplierFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private supplierService = inject(SuppliersService);
  private route = inject(ActivatedRoute);

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
          this.supplierForm.get('name')?.setValue(this.selectedSupplier.name);
          this.supplierForm.get('nit')?.setValue(this.selectedSupplier.nit);
          this.supplierForm.get('email')?.setValue(this.selectedSupplier.email);
          this.supplierForm.get('accountNumber')?.setValue(this.selectedSupplier.accountNumber);
          this.supplierForm.get('address')?.setValue(this.selectedSupplier.address);
          this.supplierForm.get('contactName')?.setValue(this.selectedSupplier.contactName);
          this.supplierForm.get('phone')?.setValue(this.selectedSupplier.phone);
          this.supplierForm.get('notes')?.setValue(this.selectedSupplier.notes);
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error creando el proveedor: ${err.error.message}`,
        });
      },
      complete: () => {

      }
    })
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
      notes: ['']
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
        this.router.navigate(['purchases/suppliers'])
      },
    });
  }

  onSaveSupplier(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    const body = this.supplierForm.value;
    const request = !this.isEditMode ? this.supplierService.createSupplier(body) : this.supplierService.editSupplier(this.selectedSupplier!.id, body);

    request.subscribe({
      next: (res) => {
        if (this.isEditMode ? res.statusCode === 200 : res.statusCode === 201) {
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Éxito', 
            detail: `El proveedor se ha ${this.isEditMode ? 'modificado' : 'creado'} correctamente.`
          });
          this.router.navigate(['/purchases/suppliers'])
        }
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Error ${this.isEditMode ? 'modificando' : 'creando'} el proveedor: ${err.error.message}`,
        });
      },
      complete: () => {
        
      }
    })
  }
}
