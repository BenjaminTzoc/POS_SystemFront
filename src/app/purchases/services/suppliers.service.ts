import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ICreateSupplier, IEditSupplier, Supplier } from '../interfaces/supplier.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SuppliersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/suppliers`;

  getSuppliers(filters?: {
    search?: string;
    includeDeleted?: boolean;
  }): Observable<ApiResponse<Supplier[]>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.includeDeleted !== undefined)
      params = params.set('includeDeleted', filters.includeDeleted.toString());

    return this.http.get<ApiResponse<Supplier[]>>(this.API_URL, { params });
  }

  getSupplierByNit(nit: string): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.API_URL}/search/nit/${nit}`);
  }

  getSupplier(supplierId: string): Observable<ApiResponse<Supplier>> {
    return this.http.get<ApiResponse<Supplier>>(`${this.API_URL}/${supplierId}`);
  }

  createSupplier(body: ICreateSupplier): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.API_URL}`, body);
  }

  editSupplier(supplierId: string, body: IEditSupplier): Observable<ApiResponse<Supplier>> {
    return this.http.put<ApiResponse<Supplier>>(`${this.API_URL}/${supplierId}`, body);
  }

  deleteSupplier(supplierId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${supplierId}`);
  }

  restoreSupplier(supplierId: string): Observable<ApiResponse<Supplier>> {
    return this.http.patch<ApiResponse<Supplier>>(`${this.API_URL}/${supplierId}/restore`, {});
  }
}
