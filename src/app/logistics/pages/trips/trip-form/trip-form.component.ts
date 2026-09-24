import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { TripsService } from '../../../services/trips.service';
import { TrucksService } from '../../../services/trucks.service';
import { BranchesService } from '../../../../inventory/services/branches.service';
import { CreateTripDto, CreateTripItemDto, TripItemType } from '../../../interfaces/trip.interface';
import { Truck } from '../../../interfaces/truck.interface';
import { Branch } from '../../../../inventory/interfaces/branch.interface';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { PrimaryButtonComponent } from '../../../../shared/components/primary-button/primary-button.component';
import { SecondaryButtonComponent } from '../../../../shared/components/secondary-button/secondary-button.component';
import { StandardTableComponent } from '../../../../shared/components/standard-table/standard-table.component';

@Component({
  selector: 'app-trip-form',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    DatePickerModule,
    TextareaModule,
    CheckboxModule,
    PageHeaderComponent,
    PrimaryButtonComponent,
    SecondaryButtonComponent,
    StandardTableComponent,
  ],
  templateUrl: './trip-form.component.html',
  styleUrl: './trip-form.component.css',
})
export class TripFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private tripsService = inject(TripsService);
  private trucksService = inject(TrucksService);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);

  tripForm: FormGroup;
  saving = signal<boolean>(false);
  loadingOperations = signal<boolean>(false);

  // Catálogos
  branches = signal<Branch[]>([]);
  trucks = signal<Truck[]>([]);
  drivers = signal<any[]>([]);

  // Operaciones pendientes cargadas desde el backend
  pendingTransfers = signal<any[]>([]);
  pendingSales = signal<any[]>([]);

  // Selecciones
  selectedTransfers = signal<any[]>([]);
  selectedSales = signal<any[]>([]);

  activeTab: 'transfers' | 'sales' = 'sales';

  // Resumen
  totalSelectedStops = computed(
    () => this.selectedTransfers().length + this.selectedSales().length
  );

  constructor() {
    this.tripForm = this.fb.group({
      date: [new Date(), [Validators.required]],
      originBranchId: [null, [Validators.required]],
      truckId: [null, [Validators.required]],
      driverId: [null, [Validators.required]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadCatalogData();
  }

  loadCatalogData(): void {
    // 1. Plantas de origen
    this.branchesService.getBranches({ isPlant: true }).subscribe({
      next: (res) => {
        const plants = res.data || [];
        this.branches.set(plants);
        if (plants.length > 0 && !this.tripForm.get('originBranchId')?.value) {
          this.tripForm.patchValue({ originBranchId: plants[0].id });
          this.onOriginBranchChange();
        }
      },
      error: () => this.branches.set([]),
    });

    // 2. Camiones activos
    this.trucksService.getTrucks('active').subscribe({
      next: (res) => this.trucks.set(res.data || []),
      error: () => this.trucks.set([]),
    });

    // 3. Conductores / Pilotos
    this.trucksService.getDrivers().subscribe({
      next: (res) => {
        const users: any[] = res.data || [];
        // Filtrar usuarios que contengan el rol 'Piloto', 'Chofer' o 'Conductor' (case-insensitive)
        let filtered = users.filter((user) =>
          user.roles?.some((role: any) => {
            const roleName = (typeof role === 'string' ? role : role.name || '').toLowerCase();
            return (
              roleName.includes('piloto') ||
              roleName.includes('chofer') ||
              roleName.includes('conductor') ||
              roleName.includes('driver')
            );
          }) ||
          (user.role && (
            user.role.toLowerCase().includes('piloto') ||
            user.role.toLowerCase().includes('chofer') ||
            user.role.toLowerCase().includes('conductor') ||
            user.role.toLowerCase().includes('driver')
          ))
        );

        // Fallback: si por alguna razón ningún usuario tiene el rol asignado aún, mostrar todos los usuarios
        if (filtered.length === 0) {
          filtered = users;
        }

        this.drivers.set(
          filtered.map((u: any) => ({
            label: `${u.name || u.firstName || u.username} (${u.email || 'Usuario'})`,
            value: u.id,
          }))
        );
      },
      error: () => this.drivers.set([]),
    });
  }

  onOriginBranchChange(): void {
    const originId = this.tripForm.get('originBranchId')?.value;
    this.selectedTransfers.set([]);
    this.selectedSales.set([]);

    if (!originId) {
      this.pendingTransfers.set([]);
      this.pendingSales.set([]);
      return;
    }

    this.loadingOperations.set(true);
    this.tripsService.getPendingOperations(originId).subscribe({
      next: (res) => {
        this.loadingOperations.set(false);
        this.pendingTransfers.set(res.data?.transfers || []);
        this.pendingSales.set(res.data?.sales || []);
      },
      error: (err) => {
        this.loadingOperations.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron cargar las operaciones pendientes.',
        });
      },
    });
  }

  onTruckChange(): void {
    const truckId = this.tripForm.get('truckId')?.value;
    if (!truckId) return;

    const truck = this.trucks().find((t) => t.id === truckId);
    if (truck?.defaultDriver?.id) {
      this.tripForm.patchValue({ driverId: truck.defaultDriver.id });
    }
  }

  // Manejo de selecciones
  isTransferSelected(transfer: any): boolean {
    return this.selectedTransfers().some((t) => t.id === transfer.id);
  }

  toggleTransfer(transfer: any): void {
    const current = this.selectedTransfers();
    const index = current.findIndex((t) => t.id === transfer.id);
    if (index > -1) {
      this.selectedTransfers.set(current.filter((t) => t.id !== transfer.id));
    } else {
      this.selectedTransfers.set([...current, transfer]);
    }
  }

  isSaleSelected(sale: any): boolean {
    return this.selectedSales().some((s) => s.id === sale.id);
  }

  toggleSale(sale: any): void {
    const current = this.selectedSales();
    const index = current.findIndex((s) => s.id === sale.id);
    if (index > -1) {
      this.selectedSales.set(current.filter((s) => s.id !== sale.id));
    } else {
      this.selectedSales.set([...current, sale]);
    }
  }

  removeTransfer(id: string): void {
    this.selectedTransfers.set(this.selectedTransfers().filter((t) => t.id !== id));
  }

  removeSale(id: string): void {
    this.selectedSales.set(this.selectedSales().filter((s) => s.id !== id));
  }

  onSaveTrip(): void {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor, completa los campos obligatorios del viaje.',
      });
      return;
    }

    if (this.totalSelectedStops() === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin Paradas',
        detail: 'Debes seleccionar al menos un traslado u orden de venta para la ruta.',
      });
      return;
    }

    this.saving.set(true);
    const formVal = this.tripForm.value;

    let dateIso = formVal.date;
    if (formVal.date instanceof Date) {
      dateIso = formVal.date.toISOString().split('T')[0];
    }

    const items: CreateTripItemDto[] = [
      ...this.selectedTransfers().map((t, idx) => ({
        type: 'transfer' as TripItemType,
        transferId: t.id,
        sequence: idx + 1,
      })),
      ...this.selectedSales().map((s, idx) => ({
        type: 'sale_order' as TripItemType,
        saleId: s.id,
        sequence: this.selectedTransfers().length + idx + 1,
      })),
    ];

    const dto: CreateTripDto = {
      date: dateIso,
      originBranchId: formVal.originBranchId,
      truckId: formVal.truckId,
      driverId: formVal.driverId,
      notes: formVal.notes?.trim() || undefined,
      items,
    };

    this.tripsService.createTrip(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Viaje Planificado',
          detail: `El viaje ${res.data.tripNumber || ''} fue creado en estado Borrador exitosamente.`,
        });
        this.router.navigate(['/logistics/trips']);
      },
      error: (err) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Guardar',
          detail: err.error?.message || 'No se pudo crear el viaje.',
        });
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/logistics/trips']);
  }
}
