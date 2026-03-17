import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { RouteDispatch } from '../interfaces/route-dispatch.interface';

@Injectable({
  providedIn: 'root',
})
export class LogisticsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/route-dispatches`;

  createRouteDispatch(body: RouteDispatch): Observable<ApiResponse<RouteDispatch>> {
    return this.http.post<ApiResponse<RouteDispatch>>(`${this.API_URL}`, body);
  }

  getRouteDispatches(): Observable<ApiResponse<RouteDispatch[]>> {
    return this.http.get<ApiResponse<RouteDispatch[]>>(`${this.API_URL}`);
  }

  getRouteDispatch(id: string): Observable<ApiResponse<RouteDispatch>> {
    return this.http.get<ApiResponse<RouteDispatch>>(`${this.API_URL}/${id}`);
  }

  receiveRouteDispatch(id: string, body: { items: { productId: string, receivedQuantity: number }[] }): Observable<ApiResponse<RouteDispatch>> {
    return this.http.patch<ApiResponse<RouteDispatch>>(`${this.API_URL}/${id}/receive`, body);
  }

  reconcileRouteDispatch(id: string): Observable<ApiResponse<RouteDispatch>> {
    return this.http.get<ApiResponse<RouteDispatch>>(`${this.API_URL}/${id}/reconcile`);
  }

  liquidateRouteDispatch(id: string, body: { items: { productId: string, soldQuantity: number, returnedQuantity: number, stayedQuantity: number, wasteQuantity: number, notes?: string }[] }): Observable<ApiResponse<RouteDispatch>> {
    return this.http.patch<ApiResponse<RouteDispatch>>(`${this.API_URL}/${id}/liquidate`, body);
  }
}
