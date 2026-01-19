import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { UnitsService } from '../../services/units.service';

@Component({
  selector: 'app-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    CheckboxModule,
    ToggleSwitchModule,
    CardModule,
  ],
  templateUrl: './unit-form.component.html',
  styleUrl: './unit-form.component.css',
})
export class UnitFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private unitsService = inject(UnitsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);

  unitForm: FormGroup;
  isEdit: boolean = false;
  unitId: string | null = null;
  loading: boolean = false;

  constructor() {
    this.unitForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      abbreviation: ['', [Validators.required]],
      allowsDecimals: [false],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.unitId = this.route.snapshot.paramMap.get('id');
    if (this.unitId) {
      this.isEdit = true;
      this.loadUnit();
    }
  }

  loadUnit(): void {
    if (!this.unitId) return;

    this.loading = true;
    this.unitsService.getUnit(this.unitId).subscribe({
      next: (response) => {
        this.unitForm.patchValue(response.data);
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la unidad de medida',
        });
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const unitData = this.unitForm.value;

    if (this.isEdit && this.unitId) {
      this.unitsService.updateUnit(this.unitId, unitData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Unidad de medida actualizada',
          });
          this.router.navigate(['/inventory/units']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la unidad de medida',
          });
          this.loading = false;
        },
      });
    } else {
      this.unitsService.createUnit(unitData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Unidad de medida creada',
          });
          this.router.navigate(['/inventory/units']);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la unidad de medida',
          });
          this.loading = false;
        },
      });
    }
  }
}
