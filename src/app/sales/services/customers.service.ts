import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ICustomer } from '../interfaces/customer.interface';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customers`;

  getCustomers(includeDeleted: boolean = false): Observable<ApiResponse<ICustomer[]>> {
    const params = { includeDeleted: includeDeleted.toString() };
    return this.http.get<ApiResponse<ICustomer[]>>(`${this.API_URL}`, { params });
  }

  getCustomer(customerId: string): Observable<ApiResponse<ICustomer>> {
    return this.http.get<ApiResponse<ICustomer>>(`${this.API_URL}/${customerId}`);
  }

  createCustomer(body: ICustomer): Observable<ApiResponse<ICustomer>> {
    return this.http.post<ApiResponse<ICustomer>>(`${this.API_URL}`, body);
  }

  editCustomer(customerId: string, body: ICustomer): Observable<ApiResponse<ICustomer>> {
    return this.http.put<ApiResponse<ICustomer>>(`${this.API_URL}/${customerId}`, body);
  }

  deleteCustomer(customerId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${customerId}`);
  }

  restoreCustomer(customerId: string): Observable<ApiResponse<ICustomer>> {
    return this.http.patch<ApiResponse<ICustomer>>(`${this.API_URL}/${customerId}/restore`, {});
  }
}
