import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sales`;

  getSales(): Observable<ApiResponse<ISaleOrderResponse[]>> {
    return this.http.get<ApiResponse<ISaleOrderResponse[]>>(`${this.API_URL}`);
  }

  getNextInvoiceNumber(): Observable<ApiResponse<{ nextNumber: string }>> {
    return this.http.get<ApiResponse<{ nextNumber: string }>>(`${this.API_URL}/next-number`);
  }

  createSale(body: any): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.post<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}`, body);
  }
}
