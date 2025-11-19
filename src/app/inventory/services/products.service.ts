import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { Category, Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/products`;

  getProducts(branchId?: string): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (branchId) {
      params = params.set('branchId', branchId);
    }

    return this.http.get<ApiResponse<Product[]>>(`${this.API_URL}`, { params });
  }

  getProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.API_URL}/${productId}`);
  }

  searchProducts(query: string): Observable<ApiResponse<Product[]>> {
    const params = { q: query };

    return this.http.get<ApiResponse<Product[]>>(`${this.API_URL}/search`, { params });
  }

  createProduct(formData: FormData) {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, formData, {});
  }

  deleteProduct(productId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${productId}`);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.API_URL}/categories`);
  }

  getCategory(idCategory: string): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.API_URL}/categories/${idCategory}`);
  }

  createCategory(body: any): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.API_URL}/categories`, body);
  }

  editCategory(categoryId: string, body: any): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.API_URL}/categories/${categoryId}`, body);
  }

  deleteCategory(idCategory: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/categories/${idCategory}`);
  }
}
