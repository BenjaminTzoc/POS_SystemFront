import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductCategory,
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from '../interfaces/product-category.interface';
import { ApiResponse } from '../../core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ProductCategoriesService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/product-categories`;

  getCategories(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Observable<ApiResponse<ProductCategory[]>> {
    let params: any = { page, limit };
    if (search) params.search = search;
    return this.http.get<ApiResponse<ProductCategory[]>>(this.apiUrl, { params });
  }

  getAllCategories(): Observable<ApiResponse<ProductCategory[]>> {
    return this.http.get<ApiResponse<ProductCategory[]>>(`${this.apiUrl}?limit=100`);
  }

  getCategory(id: string): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: CreateProductCategoryDto): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(this.apiUrl, category);
  }

  updateCategory(id: string, category: UpdateProductCategoryDto): Observable<ProductCategory> {
    return this.http.patch<ProductCategory>(`${this.apiUrl}/${id}`, category);
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
