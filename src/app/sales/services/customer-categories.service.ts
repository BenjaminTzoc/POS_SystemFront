import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ICustomerCategory } from '../interfaces/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerCategoriesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customer-categories`;

  getCategories(): Observable<ApiResponse<ICustomerCategory[]>> {
    return this.http.get<ApiResponse<ICustomerCategory[]>>(`${this.API_URL}`);
  }
}
