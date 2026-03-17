import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ICustomer, ICustomerCategory } from '../../interfaces/customer.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CustomerCategoriesService } from '../../services/customer-categories.service';
import { CustomersService } from '../../services/customers.service';

import { CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ButtonModule, CurrencyPipe, InputNumberModule, DecimalPipe],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private customerService = inject(CustomersService);
  private customerCatService = inject(CustomerCategoriesService);
  private route = inject(ActivatedRoute);

  customerId: string | null = null;
  selectedCustomer: ICustomer | null = null; //SOLO PARA EDICION
  isEditMode: boolean = false;
  isSaving: boolean = false;
  customerForm!: FormGroup;
  categories: ICustomerCategory[] = [];
  selectedCategory: ICustomerCategory | undefined;

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.customerId;
    this.initializeForm();
    this.loadCategories();

    if (this.isEditMode) {
      this.loadCustomer(this.customerId!);
    }
  }

  loadCustomer(id: string): void {
    this.customerService.getCustomer(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.selectedCustomer = res.data;
          this.customerForm.get('name')?.setValue(this.selectedCustomer.name);
          this.customerForm.get('nit')?.setValue(this.selectedCustomer.nit);
          this.customerForm.get('email')?.setValue(this.selectedCustomer.email);
          this.customerForm.get('categoryId')?.setValue(this.selectedCustomer.category.id);
          this.customerForm.get('address')?.setValue(this.selectedCustomer.address);
          this.customerForm.get('contactName')?.setValue(this.selectedCustomer.contactName);
          this.customerForm.get('phone')?.setValue(this.selectedCustomer.phone);
          this.customerForm.get('creditLimit')?.setValue(this.selectedCustomer.creditLimit);
          this.selectedCategory = this.selectedCustomer.category;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error obteniendo datos del cliente: ${err.error.message}`,
        });
        this.router.navigate(['/sales/customers']);
      },
    });
  }

  initializeForm(): void {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      nit: [''],
      contactName: ['', [Validators.required]],
      email: [''],
      phone: ['', [Validators.required]],
      address: [''],
      categoryId: [''],
      creditLimit: [0, [Validators.min(0)]],
    });

    this.customerForm.get('name')?.valueChanges.subscribe((value) => {
      const contactControl = this.customerForm.get('contactName');
      if (contactControl?.pristine) {
        contactControl.setValue(value, { emitEvent: false });
      }
    });

    this.customerForm.get('nit')?.valueChanges.subscribe((value: string) => {
      if (!value) return;

      const cleanValue = value.replace(/-/g, '').toUpperCase();

      if (cleanValue === 'CF' || cleanValue === 'C/F') {
        this.customerForm.get('nit')?.setValue(cleanValue, { emitEvent: false });
        return;
      }

      if (cleanValue.length > 1) {
        const formatted =
          cleanValue.substring(0, cleanValue.length - 1) + '-' + cleanValue.slice(-1);
        this.customerForm.get('nit')?.setValue(formatted, { emitEvent: false });
      } else {
        this.customerForm.get('nit')?.setValue(cleanValue, { emitEvent: false });
      }
    });

    this.customerForm.get('categoryId')?.valueChanges.subscribe((id) => {
      this.selectedCategory = this.categories.find((c) => c.id === id);
      
      // Si estamos creando y se selecciona categoría, sugerir el límite por defecto
      if (!this.isEditMode && this.selectedCategory) {
        this.customerForm.get('creditLimit')?.setValue(Number(this.selectedCategory.defaultCreditLimit));
      }
    });
  }

  loadCategories(): void {
    this.customerCatService.getCategories().subscribe({
      next: (res) => {
        console.log(res);
        if (res.statusCode === 200) {
          this.categories = res.data;
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error ${this.isEditMode ? 'modificando' : 'creando'} el proveedor: ${err.error.message}`,
        });
      },
    });
  }

  onSaveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos',
      });
      return;
    }

    this.isSaving = true;
    const body = this.customerForm.value;
    const request = !this.isEditMode
      ? this.customerService.createCustomer(body)
      : this.customerService.editCustomer(this.selectedCustomer!.id, body);

    request.subscribe({
      next: (res) => {
        if (this.isEditMode ? res.statusCode === 200 : res.statusCode === 201) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `El cliente se ha ${this.isEditMode ? 'modificado' : 'creado'} correctamente.`,
          });
          this.router.navigate(['/sales/customers']);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error ${this.isEditMode ? 'modificando' : 'creando'} el cliente: ${err.error.message}`,
        });
        this.isSaving = false;
      },
      complete: () => (this.isSaving = false),
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
        this.router.navigate(['sales/customers']);
      },
    });
  }

  get isPersonalizedLimit(): boolean {
    if (!this.selectedCategory) return false;
    const currentLimit = Number(this.customerForm.get('creditLimit')?.value || 0);
    const defaultLimit = Number(this.selectedCategory.defaultCreditLimit || 0);
    return currentLimit !== defaultLimit;
  }
}
