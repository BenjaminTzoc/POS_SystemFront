import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanySettingService } from '../../shared/services/company-setting.service';

@Component({
  selector: 'app-company-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './company-settings.component.html',
  styleUrls: ['./company-settings.component.css']
})
export class CompanySettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companySettingService = inject(CompanySettingService);
  private messageService = inject(MessageService);

  form!: FormGroup;
  isLoading = signal(false);
  isSaving = signal(false);

  ngOnInit() {
    this.initForm();
    this.loadSettings();
  }

  private initForm() {
    this.form = this.fb.group({
      companyName: ['', [Validators.required]],
      address: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      nit: ['', [Validators.required]]
    });
  }

  private loadSettings() {
    this.isLoading.set(true);
    this.companySettingService.getSettings().subscribe({
      next: (settings) => {
        if (settings) {
          this.form.patchValue(settings);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los datos de la empresa.'
        });
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.companySettingService.updateSettings(this.form.value).subscribe({
      next: (settings) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Datos de la empresa actualizados exitosamente.'
        });
        this.form.patchValue(settings);
        this.isSaving.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron guardar los cambios.'
        });
        this.isSaving.set(false);
      }
    });
  }
}
