import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import {
  Trip,
  TripStatus,
  CreateTripDto,
  PendingOperationsResponse,
  DeliverSalePayload,
  DeliverTransferPayload,
  ReceiveTripReturnPayload,
} from '../interfaces/trip.interface';

@Injectable({
  providedIn: 'root',
})
export class TripsService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trips`;

  getTrips(originBranchId?: string, status?: TripStatus, date?: string): Observable<ApiResponse<Trip[]>> {
    let params = new HttpParams();
    if (originBranchId) params = params.set('originBranchId', originBranchId);
    if (status) params = params.set('status', status);
    if (date) params = params.set('date', date);
    return this.http.get<ApiResponse<Trip[]>>(this.baseUrl, { params });
  }

  getTrip(id: string): Observable<ApiResponse<Trip>> {
    return this.http.get<ApiResponse<Trip>>(`${this.baseUrl}/${id}`);
  }

  getPendingOperations(originBranchId?: string): Observable<ApiResponse<PendingOperationsResponse>> {
    let params = new HttpParams();
    if (originBranchId) params = params.set('originBranchId', originBranchId);
    return this.http.get<ApiResponse<PendingOperationsResponse>>(`${this.baseUrl}/pending-operations`, { params });
  }

  createTrip(dto: CreateTripDto): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(this.baseUrl, dto);
  }

  addItems(tripId: string, items: any[]): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/items`, { items });
  }

  removeItem(tripId: string, itemId: string): Observable<ApiResponse<Trip>> {
    return this.http.delete<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/items/${itemId}`);
  }

  confirmDeparture(tripId: string): Observable<ApiResponse<Trip>> {
    return this.http.patch<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/confirm-departure`, {});
  }

  deliverSaleItem(tripId: string, itemId: string, payload: DeliverSalePayload): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/items/${itemId}/deliver-sale`, payload);
  }

  deliverTransferItem(tripId: string, itemId: string, payload: DeliverTransferPayload): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/items/${itemId}/deliver-transfer`, payload);
  }

  receiveReturn(tripId: string, returnId: string, payload: ReceiveTripReturnPayload): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/returns/${returnId}/receive`, payload);
  }

  resolveIncident(tripId: string, incidentId: string, resolutionNotes: string): Observable<ApiResponse<Trip>> {
    return this.http.patch<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/incidents/${incidentId}/resolve`, {
      resolutionNotes,
    });
  }

  completeTrip(tripId: string): Observable<ApiResponse<Trip>> {
    return this.http.patch<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/complete`, {});
  }

  cancelTrip(tripId: string, reason?: string): Observable<ApiResponse<Trip>> {
    return this.http.patch<ApiResponse<Trip>>(`${this.baseUrl}/${tripId}/cancel`, { reason });
  }
}
