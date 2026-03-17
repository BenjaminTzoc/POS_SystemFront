import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UnitsService } from '../services/units.service';
import { UnitMeasure } from '../interfaces/unit.interface';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    FormsModule,
    ToggleSwitchModule,
    TagModule,
  ],
  templateUrl: './units.component.html',
  styleUrl: './units.component.css',
})
export class UnitsComponent implements OnInit {
  private unitsService = inject(UnitsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);

  units: UnitMeasure[] = [];
  loading: boolean = true;
  searchTerm: string = '';
  showDeleted: boolean = false;

  get canViewDeleted(): boolean {
    const user = this.authService.currentUser;
    if (!user) return false;
    // Solo SuperAdmin y Admin pueden ver eliminados
    return user.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  }

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.loading = true;
    this.unitsService.getUnits(this.showDeleted).subscribe({
      next: (response) => {
        this.units = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las unidades de medida',
        });
        this.loading = false;
      },
    });
  }

  toggleShowDeleted(): void {
    this.showDeleted = !this.showDeleted;
    this.loadUnits();
  }

  isDeleted(unit: UnitMeasure): boolean {
    return unit.deletedAt != null;
  }

  deleteUnit(id: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar esta unidad de medida?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.unitsService.deleteUnit(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Unidad de medida eliminada',
            });
            this.loadUnits();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la unidad de medida',
            });
          },
        });
      },
    });
  }

  restoreUnit(id: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas restaurar esta unidad de medida?',
      header: 'Confirmar restauración',
      icon: 'pi pi-refresh',
      acceptLabel: 'Restaurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.unitsService.restoreUnit(id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Unidad de medida restaurada',
            });
            this.loadUnits();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo restaurar la unidad de medida',
            });
          },
        });
      },
    });
  }
}
