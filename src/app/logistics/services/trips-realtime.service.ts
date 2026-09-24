import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TripsSocket } from './trips-socket';

export type TripUpdatedType = 'SALE_DELIVERED' | 'TRANSFER_RECEIVED' | 'TRIP_STATUS_CHANGED';

export interface TripUpdatedPayload {
  type: TripUpdatedType;
  tripId: string;
  itemId?: string;
  itemStatus?: string;
  outcome?: string;
  transferStatus?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TripsRealtimeService {
  private socket = inject(TripsSocket);

  tripUpdated$(): Observable<TripUpdatedPayload> {
    return this.socket.fromEvent<TripUpdatedPayload>('tripUpdated');
  }

  joinTrip(tripId: string): void {
    if (!tripId) return;
    this.socket.emit('joinTrip', tripId);
  }

  leaveTrip(tripId: string): void {
    if (!tripId) return;
    this.socket.emit('leaveTrip', tripId);
  }
}
