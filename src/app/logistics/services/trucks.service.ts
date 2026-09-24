import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { Truck, CreateTruckDto, UpdateTruckDto, TruckStatus } from '../interfaces/truck.interface';

@Injectable({
  providedIn: 'root',
})
export class TrucksService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/trucks`;

  getTrucks(status?: TruckStatus): Observable<ApiResponse<Truck[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Truck[]>>(this.baseUrl, { params });
  }

  getDrivers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/users`);
  }

  getTruck(id: string): Observable<ApiResponse<Truck>> {
    return this.http.get<ApiResponse<Truck>>(`${this.baseUrl}/${id}`);
  }

  createTruck(dto: CreateTruckDto): Observable<ApiResponse<Truck>> {
    return this.http.post<ApiResponse<Truck>>(this.baseUrl, dto);
  }

  updateTruck(id: string, dto: UpdateTruckDto): Observable<ApiResponse<Truck>> {
    return this.http.patch<ApiResponse<Truck>>(`${this.baseUrl}/${id}`, dto);
  }

  deleteTruck(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.baseUrl}/${id}`);
  }
}
