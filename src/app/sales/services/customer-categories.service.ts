import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ICustomerCategory } from '../interfaces/customer.interface';

@Injectable({
  providedIn: 'root'
})
export class CustomerCategoriesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/customer-categories`;

  getCategories(includeDeleted: boolean = false): Observable<ApiResponse<ICustomerCategory[]>> {
    return this.http.get<ApiResponse<ICustomerCategory[]>>(`${this.API_URL}?includeDeleted=${includeDeleted}`);
  }

  getCategoryById(id: string, includeDeleted: boolean = false): Observable<ApiResponse<ICustomerCategory>> {
    return this.http.get<ApiResponse<ICustomerCategory>>(`${this.API_URL}/${id}?includeDeleted=${includeDeleted}`);
  }

  getCategoryByName(name: string): Observable<ApiResponse<ICustomerCategory>> {
    return this.http.get<ApiResponse<ICustomerCategory>>(`${this.API_URL}/name/${name}`);
  }

  createCategory(category: Partial<ICustomerCategory>): Observable<ApiResponse<ICustomerCategory>> {
    return this.http.post<ApiResponse<ICustomerCategory>>(`${this.API_URL}`, category);
  }

  updateCategory(id: string, category: Partial<ICustomerCategory>): Observable<ApiResponse<ICustomerCategory>> {
    return this.http.put<ApiResponse<ICustomerCategory>>(`${this.API_URL}/${id}`, category);
  }

  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  restoreCategory(id: string): Observable<ApiResponse<ICustomerCategory>> {
    return this.http.patch<ApiResponse<ICustomerCategory>>(`${this.API_URL}/${id}/restore`, {});
  }
}
