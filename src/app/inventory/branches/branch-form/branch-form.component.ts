import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputMaskModule } from 'primeng/inputmask';
import { ConfirmationService, MessageService } from 'primeng/api';
import { BranchesService } from '../../services/branches.service';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    CardModule,
    ToggleSwitchModule,
    InputMaskModule
  ],
  templateUrl: './branch-form.component.html',
  styleUrl: './branch-form.component.css',
})
export class BranchFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  branchForm!: FormGroup;
  isEdit: boolean = false;
  branchId: string | null = null;
  loading: boolean = false;

  ngOnInit(): void {
    this.createForm();
    this.branchId = this.route.snapshot.paramMap.get('id');
    if (this.branchId) {
      this.isEdit = true;
      this.loadBranchData(this.branchId);
    }
  }

  createForm(): void {
    this.branchForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      isPlant: [false],
    });
  }

  loadBranchData(id: string): void {
    this.loading = true;
    this.branchesService.getBranch(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branchForm.patchValue(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la sucursal',
        });
        this.router.navigate(['/inventory/branches']);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const body = this.branchForm.value;

    const request = this.isEdit
      ? this.branchesService.updateBranch(this.branchId!, body)
      : this.branchesService.createBranch(body);

    request.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Sucursal ${this.isEdit ? 'actualizada' : 'creada'} correctamente`,
        });
        this.router.navigate(['/inventory/branches']);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${this.isEdit ? 'actualizar' : 'crear'} la sucursal`,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    if (this.branchForm.dirty) {
      this.confirmationService.confirm({
        message: '¿Estás seguro de cancelar? Los cambios no guardados se perderán.',
        header: 'Confirmar cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, salir',
        rejectLabel: 'Continuar editando',
        accept: () => {
          this.router.navigate(['/inventory/branches']);
        },
      });
    } else {
      this.router.navigate(['/inventory/branches']);
    }
  }
}
