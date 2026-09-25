import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TrucksService } from '../../services/trucks.service';
import { Truck, TruckStatus } from '../../interfaces/truck.interface';
import { TruckModalComponent } from './truck-modal/truck-modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-trucks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    TooltipModule,
    TruckModalComponent,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './trucks.component.html',
  styleUrl: './trucks.component.css',
})
export class TrucksComponent implements OnInit {
  private trucksService = inject(TrucksService);
  private messageService = inject(MessageService);

  trucks = signal<Truck[]>([]);
  loading = signal<boolean>(false);
  searchTerm = signal<string>('');
  statusFilter = signal<TruckStatus | null>(null);

  modalVisible = false;
  selectedTruck: Truck | null = null;

  showDeleteModal = false;
  truckToDelete: Truck | null = null;
  isDeleting = false;

  statusOptions = [
    { label: 'Activo', value: 'active' },
    { label: 'Mantenimiento', value: 'maintenance' },
    { label: 'Inactivo', value: 'inactive' },
  ];

  filteredTrucks = computed(() => {
    let list = this.trucks();
    const status = this.statusFilter();
    const search = this.searchTerm().toLowerCase().trim();

    if (status) {
      list = list.filter((t) => t.status === status);
    }

    if (search) {
      list = list.filter(
        (t) =>
          t.licensePlate.toLowerCase().includes(search) ||
          t.name.toLowerCase().includes(search) ||
          (t.brand && t.brand.toLowerCase().includes(search)) ||
          (t.model && t.model.toLowerCase().includes(search)) ||
          (t.defaultDriver?.name && t.defaultDriver.name.toLowerCase().includes(search))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadTrucks();
  }

  loadTrucks(): void {
    this.loading.set(true);
    this.trucksService.getTrucks().subscribe({
      next: (res) => {
        this.trucks.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron cargar los vehículos.',
        });
      },
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  openCreateModal(): void {
    this.selectedTruck = null;
    this.modalVisible = true;
  }

  openEditModal(truck: Truck): void {
    this.selectedTruck = truck;
    this.modalVisible = true;
  }

  onTruckSaved(): void {
    this.loadTrucks();
  }

  confirmDelete(truck: Truck): void {
    this.truckToDelete = truck;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.truckToDelete || this.isDeleting) return;
    this.isDeleting = true;
    const truck = this.truckToDelete;

    this.trucksService.deleteTruck(truck.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.truckToDelete = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Vehículo eliminado',
          detail: 'El vehículo ha sido eliminado exitosamente.',
        });
        this.loadTrucks();
      },
      error: (err) => {
        this.isDeleting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo eliminar el vehículo.',
        });
      },
    });
  }

  getStatusLabel(status: TruckStatus): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'maintenance':
        return 'Mantenimiento';
      case 'inactive':
        return 'Inactivo';
      default:
        return status;
    }
  }

  getStatusSeverity(status: TruckStatus): 'success' | 'warn' | 'danger' {
    switch (status) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warn';
      case 'inactive':
        return 'danger';
      default:
        return 'warn';
    }
  }
}
