import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PilotoTripsService } from '../../services/piloto-trips.service';
import { TripsRealtimeService } from '../../../logistics/services/trips-realtime.service';
import { PilotoTrip, PilotoTripStatus } from '../../models/piloto-trip.models';

@Component({
  selector: 'app-piloto-mis-viajes',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './mis-viajes.component.html',
  styleUrl: './mis-viajes.component.css',
})
export class MisViajesComponent {
  private trips = inject(PilotoTripsService);
  private router = inject(Router);
  private messages = inject(MessageService);
  private realtime = inject(TripsRealtimeService);
  private destroyRef = inject(DestroyRef);
  private joinedTripIds = new Set<string>();

  loading = signal(false);
  tripsList = signal<PilotoTrip[]>([]);
  dateFilter = signal<string>('');

  hasTrips = computed(() => this.tripsList().length > 0);

  constructor() {
    this.load();
    this.realtime
      .tripUpdated$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        if (this.joinedTripIds.has(payload.tripId)) this.load(true);
      });
    this.destroyRef.onDestroy(() => this.syncJoins([]));
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    const date = this.dateFilter().trim() || undefined;
    this.trips.getMine(date).subscribe({
      next: (res) => {
        const payload = res.data as PilotoTrip[] | { trips?: PilotoTrip[] } | null;
        const list = Array.isArray(payload) ? payload : (payload?.trips ?? []);
        this.tripsList.set(list);
        this.syncJoins(list.map((trip) => trip.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (silent) return;
        this.messages.add({
          severity: 'error',
          summary: 'Viajes',
          detail: err.error?.message || 'No se pudieron cargar tus viajes.',
        });
      },
    });
  }

  private syncJoins(tripIds: string[]): void {
    const next = new Set(tripIds.filter(Boolean));
    for (const id of this.joinedTripIds) {
      if (!next.has(id)) this.realtime.leaveTrip(id);
    }
    for (const id of next) {
      if (!this.joinedTripIds.has(id)) this.realtime.joinTrip(id);
    }
    this.joinedTripIds = next;
  }

  onDateChange(value: string): void {
    this.dateFilter.set(value);
    this.load();
  }

  clearDate(): void {
    this.dateFilter.set('');
    this.load();
  }

  openTrip(trip: PilotoTrip): void {
    this.router.navigate(['/piloto', trip.id]);
  }

  stopCount(trip: PilotoTrip): number {
    if (typeof trip.stopCount === 'number') return trip.stopCount;
    return trip.items?.length ?? 0;
  }

  pendingCount(trip: PilotoTrip): number {
    if (typeof trip.pendingCount === 'number') return trip.pendingCount;
    return (trip.items ?? []).filter((item) => item.status === 'pending').length;
  }

  statusLabel(status: PilotoTripStatus): string {
    switch (status) {
      case 'draft':
        return 'Por salir';
      case 'on_route':
        return 'En ruta';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  statusClass(status: PilotoTripStatus): string {
    switch (status) {
      case 'draft':
        return 'is-draft';
      case 'on_route':
        return 'is-route';
      case 'completed':
        return 'is-done';
      default:
        return 'is-muted';
    }
  }

  vehicleLabel(trip: PilotoTrip): string {
    const name = trip.truck?.name?.trim();
    const plate = trip.truck?.licensePlate?.trim();
    if (name && plate) return `${name} · ${plate}`;
    return name || plate || 'Sin vehículo';
  }
}
