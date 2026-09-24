import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { filter } from 'rxjs';
import { PilotoTripsService } from '../../services/piloto-trips.service';
import { TripsRealtimeService } from '../../../logistics/services/trips-realtime.service';
import {
  PilotoIncident,
  PilotoReturn,
  PilotoSale,
  PilotoStop,
  PilotoStopStatus,
  PilotoTrip,
  PilotoTripStatus,
} from '../../models/piloto-trip.models';

@Component({
  selector: 'app-piloto-viaje-detalle',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './viaje-detalle.component.html',
  styleUrl: './viaje-detalle.component.css',
})
export class ViajeDetalleComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trips = inject(PilotoTripsService);
  private realtime = inject(TripsRealtimeService);
  private messages = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  tripId = this.route.snapshot.paramMap.get('id') ?? '';
  loading = signal(true);
  departing = signal(false);
  completing = signal(false);
  reporting = signal(false);
  confirmOpen = signal(false);
  completeOpen = signal(false);
  incidentOpen = signal(false);
  incidentDraft = signal('');
  incidentStopId = signal('');
  trip = signal<PilotoTrip | null>(null);

  stops = computed(() => {
    const items = [...(this.trip()?.items ?? [])];
    return items.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  });

  pendingReturns = computed(() =>
    (this.trip()?.returns ?? []).filter((item) => item.status === 'pending_receipt'),
  );

  canDepart = computed(() => {
    const current = this.trip();
    return current?.status === 'draft' && (current.items?.length ?? 0) > 0;
  });

  canReportIncident = computed(() => this.trip()?.status === 'on_route');

  canComplete = computed(() => {
    const current = this.trip();
    if (!current || current.status !== 'on_route') return false;
    const items = current.items ?? [];
    if (!items.length) return false;
    if (items.some((item) => item.status === 'pending' || item.status === 'failed')) return false;
    if ((current.returns ?? []).some((item) => item.status === 'pending_receipt')) return false;
    if ((current.incidents ?? []).some((item) => item.status === 'open')) return false;
    return true;
  });

  completeBlockHint = computed(() => {
    const current = this.trip();
    if (!current || current.status !== 'on_route' || this.canComplete()) return '';
    const items = current.items ?? [];
    if (items.some((item) => item.status === 'pending')) return 'Aún hay paradas pendientes.';
    if (items.some((item) => item.status === 'failed')) {
      return 'Hay una parada fallida. Planta debe resolver la incidencia.';
    }
    if ((current.returns ?? []).some((item) => item.status === 'pending_receipt')) {
      return 'Hay merma o devolución pendiente de recibir en planta.';
    }
    if ((current.incidents ?? []).some((item) => item.status === 'open')) {
      return 'Hay incidencias abiertas. Planta las resuelve.';
    }
    return 'El viaje aún no se puede completar.';
  });

  constructor() {
    if (!this.tripId) {
      this.router.navigate(['/piloto']);
      return;
    }
    this.load();
    this.realtime.joinTrip(this.tripId);
    this.realtime
      .tripUpdated$()
      .pipe(
        filter((payload) => payload.tripId === this.tripId),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load(true));
    this.destroyRef.onDestroy(() => this.realtime.leaveTrip(this.tripId));
  }

  load(silent = false): void {
    if (!silent) this.loading.set(true);
    this.trips.getById(this.tripId).subscribe({
      next: (res) => {
        this.trip.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (silent) return;
        const status = err.status;
        this.messages.add({
          severity: 'error',
          summary: status === 403 ? 'Sin acceso' : 'Viaje',
          detail:
            err.error?.message ||
            (status === 403 ? 'Este viaje no te corresponde.' : 'No se pudo cargar el viaje.'),
        });
        if (status === 403 || status === 404) {
          this.router.navigate(['/piloto']);
        }
      },
    });
  }

  back(): void {
    this.router.navigate(['/piloto']);
  }

  openStop(stop: PilotoStop): void {
    this.router.navigate(['/piloto', this.tripId, 'parada', stop.id]);
  }

  askDepart(): void {
    if (!this.canDepart()) return;
    this.confirmOpen.set(true);
  }

  cancelDepart(): void {
    this.confirmOpen.set(false);
  }

  confirmDepart(): void {
    if (!this.canDepart() || this.departing()) return;
    this.departing.set(true);
    this.trips.confirmDeparture(this.tripId).subscribe({
      next: (res) => {
        this.departing.set(false);
        this.confirmOpen.set(false);
        if (res.data) this.trip.set(res.data);
        else this.load();
        this.messages.add({
          severity: 'success',
          summary: 'En ruta',
          detail: 'Salida confirmada. Toca una parada para entregarla.',
        });
      },
      error: (err) => {
        this.departing.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se pudo salir',
          detail: err.error?.message || 'No se confirmó la salida.',
        });
      },
    });
  }

  openIncidentForm(): void {
    if (!this.canReportIncident()) return;
    this.incidentOpen.set(true);
    this.completeOpen.set(false);
    this.incidentDraft.set('');
    this.incidentStopId.set('');
  }

  cancelIncident(): void {
    this.incidentOpen.set(false);
    this.incidentDraft.set('');
    this.incidentStopId.set('');
  }

  submitIncident(): void {
    if (!this.canReportIncident() || this.reporting()) return;
    const description = this.incidentDraft().trim();
    if (!description) {
      this.messages.add({
        severity: 'warn',
        summary: 'Incidencia',
        detail: 'Describe qué pasó.',
      });
      return;
    }
    this.reporting.set(true);
    const tripItemId = this.incidentStopId().trim() || undefined;
    this.trips.createIncident(this.tripId, { description, tripItemId }).subscribe({
      next: (res) => {
        this.reporting.set(false);
        this.cancelIncident();
        if (res.data) this.trip.set(res.data);
        else this.load();
        this.messages.add({
          severity: 'success',
          summary: 'Incidencia',
          detail: 'Quedó reportada. Planta la resuelve.',
        });
      },
      error: (err) => {
        this.reporting.set(false);
        this.messages.add({
          severity: 'error',
          summary: 'No se reportó',
          detail: err.error?.message || 'No se pudo crear la incidencia.',
        });
      },
    });
  }

  askComplete(): void {
    if (!this.canComplete()) return;
    this.completeOpen.set(true);
    this.incidentOpen.set(false);
  }

  cancelComplete(): void {
    this.completeOpen.set(false);
  }

  confirmComplete(): void {
    if (!this.canComplete() || this.completing()) return;
    this.completing.set(true);
    this.trips.completeTrip(this.tripId).subscribe({
      next: (res) => {
        this.completing.set(false);
        this.completeOpen.set(false);
        if (res.data) this.trip.set(res.data);
        else this.load();
        this.messages.add({
          severity: 'success',
          summary: 'Viaje completado',
          detail: 'El viaje quedó cerrado.',
        });
      },
      error: (err) => {
        this.completing.set(false);
        this.load(true);
        this.messages.add({
          severity: 'error',
          summary: 'No se completó',
          detail: err.error?.message || 'Aún falta algo por cerrar.',
        });
      },
    });
  }

  stopOptionLabel(stop: PilotoStop): string {
    const seq = stop.sequence ? `${stop.sequence}. ` : '';
    if (stop.type === 'sale_order') return `${seq}${this.customerName(stop.sale)}`;
    return `${seq}${this.destBranch(stop)}`;
  }

  statusLabel(status: PilotoTripStatus | PilotoStopStatus): string {
    switch (status) {
      case 'draft':
        return 'Por salir';
      case 'on_route':
        return 'En ruta';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'pending':
        return 'Pendiente';
      case 'delivered':
        return 'Entregado';
      case 'partially_delivered':
        return 'Parcial';
      case 'rejected':
        return 'Rechazado';
      case 'failed':
        return 'Fallido';
      default:
        return status;
    }
  }

  vehicleLabel(trip: PilotoTrip | null): string {
    if (!trip?.truck) return 'Sin vehículo';
    const name = trip.truck.name?.trim();
    const plate = trip.truck.licensePlate?.trim();
    if (name && plate) return `${name} · ${plate}`;
    return name || plate || 'Sin vehículo';
  }

  customerName(sale?: PilotoSale): string {
    return sale?.customer?.name || sale?.guestCustomer?.name || 'Cliente';
  }

  invoiceLabel(sale?: PilotoSale): string {
    const number = sale?.invoiceNumber || sale?.orderNumber;
    return number ? `#${number}` : 'Sin factura';
  }

  destBranch(stop: PilotoStop): string {
    return (
      stop.transfer?.destinationBranch?.name ||
      stop.transfer?.toBranch?.name ||
      'Sucursal destino'
    );
  }

  transferNumber(stop: PilotoStop): string {
    return stop.transfer?.transferNumber || '';
  }

  deliveryAddress(stop: PilotoStop): string {
    if (stop.type === 'sale_order') {
      return stop.sale?.deliveryAddress?.trim() || '';
    }
    return (
      stop.transfer?.destinationBranch?.address?.trim() ||
      stop.transfer?.toBranch?.address?.trim() ||
      ''
    );
  }

  returnSummary(ret: PilotoReturn): string {
    const items = ret.items ?? [];
    if (!items.length) return 'Sin detalle';
    return items
      .map((item) => {
        const unit = item.product?.unit?.abbreviation?.trim();
        const qty = `${item.returnedQuantity}${unit ? ' ' + unit : ''}`;
        return `${qty} ${item.product?.name || 'producto'}`;
      })
      .join(' · ');
  }

  incidentText(incident: PilotoIncident): string {
    return incident.description || 'Incidencia';
  }

  incidentStopLabel(incident: PilotoIncident): string {
    if (!incident.tripItemId) return '';
    const stop = this.stops().find((item) => item.id === incident.tripItemId);
    return stop ? this.stopOptionLabel(stop) : '';
  }
}
