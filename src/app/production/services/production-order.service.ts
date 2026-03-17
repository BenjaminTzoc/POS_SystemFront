import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { IProductionOrder, ICreateProductionOrder, ICompleteProductionOrder } from '../interfaces/production-order.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductionOrderService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/production/orders`;

  getOrders(): Observable<ApiResponse<IProductionOrder[]>> {
    return this.http.get<ApiResponse<IProductionOrder[]>>(this.API_URL);
  }

  getOrder(id: string): Observable<ApiResponse<IProductionOrder>> {
    return this.http.get<ApiResponse<IProductionOrder>>(`${this.API_URL}/${id}`);
  }

  createOrder(data: ICreateProductionOrder): Observable<ApiResponse<IProductionOrder>> {
    return this.http.post<ApiResponse<IProductionOrder>>(this.API_URL, data);
  }

  completeOrder(id: string, data: ICompleteProductionOrder): Observable<ApiResponse<IProductionOrder>> {
    return this.http.patch<ApiResponse<IProductionOrder>>(`${this.API_URL}/${id}/complete`, data);
  }

  cancelOrder(id: string, reason?: string): Observable<ApiResponse<IProductionOrder>> {
    return this.http.patch<ApiResponse<IProductionOrder>>(`${this.API_URL}/${id}/cancel`, { reason });
  }
}
