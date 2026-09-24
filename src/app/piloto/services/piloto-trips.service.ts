import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import {
  PilotoCreateIncidentPayload,
  PilotoDeliverSalePayload,
  PilotoTrip,
} from '../models/piloto-trip.models';

@Injectable({
  providedIn: 'root',
})
export class PilotoTripsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trips`;

  getMine(date?: string): Observable<ApiResponse<PilotoTrip[]>> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<PilotoTrip[]>>(`${this.baseUrl}/mine`, { params });
  }

  getById(id: string): Observable<ApiResponse<PilotoTrip>> {
    return this.http.get<ApiResponse<PilotoTrip>>(`${this.baseUrl}/${id}`);
  }

  confirmDeparture(id: string): Observable<ApiResponse<PilotoTrip>> {
    return this.http.patch<ApiResponse<PilotoTrip>>(`${this.baseUrl}/${id}/confirm-departure`, {});
  }

  deliverSale(
    tripId: string,
    itemId: string,
    payload: PilotoDeliverSalePayload,
  ): Observable<ApiResponse<PilotoTrip>> {
    return this.http.post<ApiResponse<PilotoTrip>>(
      `${this.baseUrl}/${tripId}/items/${itemId}/deliver-sale`,
      payload,
    );
  }

  createIncident(
    tripId: string,
    payload: PilotoCreateIncidentPayload,
  ): Observable<ApiResponse<PilotoTrip>> {
    return this.http.post<ApiResponse<PilotoTrip>>(`${this.baseUrl}/${tripId}/incidents`, payload);
  }

  completeTrip(tripId: string): Observable<ApiResponse<PilotoTrip>> {
    return this.http.patch<ApiResponse<PilotoTrip>>(`${this.baseUrl}/${tripId}/complete`, {});
  }
}
