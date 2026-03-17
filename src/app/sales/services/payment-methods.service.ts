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

  getPaymentMethods(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}`);
  }
}
