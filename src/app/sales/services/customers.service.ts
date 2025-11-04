import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ICustomer } from '../interfaces/customer.interface';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customers`;

  getCustomers(): Observable<ApiResponse<ICustomer[]>> {
    return this.http.get<ApiResponse<ICustomer[]>>(`${this.API_URL}`);
  }

  deleteCustomer(customerId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${customerId}`);
  }
}
