import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AreasService } from '../../../services/areas.service';
import { Area } from '../../../interfaces/area.interface';

@Component({
  selector: 'app-area-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
  ],
  templateUrl: './area-form.component.html',
  styleUrl: './area-form.component.css',
})
export class AreaFormComponent implements OnInit {
  private areasService = inject(AreasService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  areaForm!: FormGroup;
  areas: Area[] = [];
  isEditMode = false;
  areaId: string | null = null;
  isSaving = false;

  ngOnInit(): void {
    this.areaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.areaId;

    this.initForm();
    this.loadAreas();

    if (this.isEditMode) {
      this.loadArea(this.areaId!);
    }
  }

  initForm(): void {
    this.areaForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      previousAreaId: [null],
    });
  }

  loadAreas(): void {
    this.areasService.getAreas().subscribe({
      next: (res) => {
        // Filter out current area if in edit mode
        this.areas = res.data.filter((a) => a.id !== this.areaId && !a.deletedAt);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las áreas para el pipeline',
        });
      },
    });
  }

  loadArea(id: string): void {
    this.areasService.getArea(id, true).subscribe({
      next: (res) => {
        this.areaForm.patchValue({
          name: res.data.name,
          description: res.data.description,
          previousAreaId: res.data.previousArea?.id || null,
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del área',
        });
      },
    });
  }

  onSave(): void {
    if (this.areaForm.invalid) {
      this.areaForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.areaForm.value;

    if (this.isEditMode) {
      this.areasService.updateArea(this.areaId!, formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Área actualizada correctamente',
          });
          this.router.navigate(['/logistics/areas']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo actualizar el área',
          });
          this.isSaving = false;
        },
      });
    } else {
      this.areasService.createArea(formValue).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Área creada correctamente',
          });
          this.router.navigate(['/logistics/areas']);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.message || 'No se pudo crear el área',
          });
          this.isSaving = false;
        },
      });
    }
  }

  onCancel(): void {
    if (this.areaForm.dirty) {
      this.confirmationService.confirm({
        message: '¿Estás seguro de cancelar? Los cambios no guardados se perderán.',
        header: 'Confirmar cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, cancelar',
        rejectLabel: 'No, volver',
        acceptButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.router.navigate(['/logistics/areas']);
        },
      });
    } else {
      this.router.navigate(['/logistics/areas']);
    }
  }
}
