import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ICustomer, ICustomerCategory } from '../../interfaces/customer.interface';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CustomerCategoriesService } from '../../services/customer-categories.service';
import { CustomersService } from '../../services/customers.service';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, InputTextModule, SelectModule, ButtonModule],
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
      categoryId: ['', [Validators.required]],
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
      acceptLabel: 'Cancelar proceso',
      rejectLabel: 'Regresar',
      acceptButtonStyleClass: 'p-button-danger !rounded-2xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-2xl',

      accept: () => {
        this.router.navigate(['sales/customers']);
      },
    });
  }
}
