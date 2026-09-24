import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TripsService } from '../../services/trips.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { Trip, TripStatus } from '../../interfaces/trip.interface';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { RefreshButtonComponent } from '../../../shared/components/refresh-button/refresh-button.component';
import { PrimaryButtonComponent } from '../../../shared/components/primary-button/primary-button.component';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input.component';
import { StandardTableComponent } from '../../../shared/components/standard-table/standard-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    SelectModule,
    DatePickerModule,
    TooltipModule,
    PageHeaderComponent,
    RefreshButtonComponent,
    PrimaryButtonComponent,
    SearchInputComponent,
    StandardTableComponent,
    StatusBadgeComponent,
    ConfirmationModalComponent,
  ],
  templateUrl: './trips.component.html',
  styleUrl: './trips.component.css',
})
export class TripsComponent implements OnInit {
  private tripsService = inject(TripsService);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  trips = signal<Trip[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal<boolean>(false);

  searchTerm = signal<string>('');
  selectedStatus = signal<TripStatus | null>(null);
  selectedOriginBranch = signal<string | null>(null);
  dateRange: Date[] | null = null;

  selectedTrip: Trip | null = null;
  showDepartureModal = false;
  showCancelModal = false;
  isActing = false;

  statusOptions = [
    { label: 'Borrador', value: 'draft' },
    { label: 'En Ruta', value: 'on_route' },
    { label: 'Completado', value: 'completed' },
    { label: 'Cancelado', value: 'cancelled' },
  ];

  filteredTrips = computed(() => {
    let list = this.trips();
    const search = this.searchTerm().toLowerCase().trim();

    if (search) {
      list = list.filter(
        (t) =>
          t.tripNumber?.toLowerCase().includes(search) ||
          t.truck?.licensePlate?.toLowerCase().includes(search) ||
          t.truck?.name?.toLowerCase().includes(search) ||
          t.driver?.name?.toLowerCase().includes(search) ||
          t.originBranch?.name?.toLowerCase().includes(search)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadTrips();
  }

  loadBranches(): void {
    this.branchesService.getBranches({ isPlant: true }).subscribe({
      next: (res) => this.branches.set(res.data || []),
      error: () => this.branches.set([]),
    });
  }

  loadTrips(): void {
    this.loading.set(true);

    const originBranchId = this.selectedOriginBranch() || undefined;
    const status = this.selectedStatus() || undefined;
    let dateStr: string | undefined;

    if (this.dateRange && this.dateRange[0]) {
      dateStr = this.dateRange[0].toISOString().split('T')[0];
    }

    this.tripsService.getTrips(originBranchId, status, dateStr).subscribe({
      next: (res) => {
        this.trips.set(res.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudieron cargar los viajes.',
        });
      },
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  goToNewTrip(): void {
    this.router.navigate(['/logistics/trips/new']);
  }

  goToTripDetail(tripId: string): void {
    this.router.navigate(['/logistics/trips', tripId]);
  }

  confirmDeparture(trip: Trip): void {
    this.selectedTrip = trip;
    this.showDepartureModal = true;
  }

  executeDeparture(): void {
    if (!this.selectedTrip || this.isActing) return;
    this.isActing = true;
    const trip = this.selectedTrip;

    this.tripsService.confirmDeparture(trip.id).subscribe({
      next: () => {
        this.isActing = false;
        this.showDepartureModal = false;
        this.selectedTrip = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Viaje en ruta',
          detail: `El viaje ${trip.tripNumber} ha salido a ruta exitosamente.`,
        });
        this.loadTrips();
      },
      error: (err) => {
        this.isActing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo confirmar la salida del viaje.',
        });
      },
    });
  }

  confirmCancel(trip: Trip): void {
    this.selectedTrip = trip;
    this.showCancelModal = true;
  }

  executeCancel(): void {
    if (!this.selectedTrip || this.isActing) return;
    this.isActing = true;
    const trip = this.selectedTrip;

    this.tripsService.cancelTrip(trip.id).subscribe({
      next: () => {
        this.isActing = false;
        this.showCancelModal = false;
        this.selectedTrip = null;
        this.messageService.add({
          severity: 'info',
          summary: 'Viaje cancelado',
          detail: `El viaje ${trip.tripNumber} ha sido cancelado.`,
        });
        this.loadTrips();
      },
      error: (err) => {
        this.isActing = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo cancelar el viaje.',
        });
      },
    });
  }

  getStatusLabel(status: TripStatus): string {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'on_route':
        return 'En Ruta';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getStatusSeverity(status: TripStatus): 'info' | 'warn' | 'success' | 'danger' {
    switch (status) {
      case 'draft':
        return 'info';
      case 'on_route':
        return 'warn';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'info';
    }
  }

  getTransfersCount(trip: Trip): number {
    return (trip.items || []).filter((i) => i.type === 'transfer').length;
  }

  getSalesCount(trip: Trip): number {
    return (trip.items || []).filter((i) => i.type === 'sale_order').length;
  }
}
