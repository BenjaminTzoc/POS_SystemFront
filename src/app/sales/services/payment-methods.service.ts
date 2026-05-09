import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentMethodsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/payment-methods`;

  getPaymentMethods(includeDeleted: boolean = false): Observable<ApiResponse<any[]>> {
    const params = includeDeleted ? '?includeDeleted=true' : '';
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}${params}`);
  }

  getPaymentMethod(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  createPaymentMethod(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, body);
  }

  updatePaymentMethod(id: string, body: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/${id}`, body);
  }

  deletePaymentMethod(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  restorePaymentMethod(id: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.API_URL}/${id}/restore`, {});
  }
}
