import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import {
  AddSalesToFolderDto,
  CreateSaleFolderDto,
  ReorderFolderSalesDto,
  SaleFolderDetailDto,
  SaleFolderDto,
  UpdateSaleFolderDto,
} from '../interfaces/sale-folder.interface';

@Injectable({
  providedIn: 'root',
})
export class SaleFoldersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sale-folders`;

  list(branchId?: string | null): Observable<ApiResponse<SaleFolderDto[]>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<SaleFolderDto[]>>(this.API_URL, { params });
  }

  get(id: string): Observable<ApiResponse<SaleFolderDetailDto>> {
    return this.http.get<ApiResponse<SaleFolderDetailDto>>(`${this.API_URL}/${id}`);
  }

  create(body: CreateSaleFolderDto): Observable<ApiResponse<SaleFolderDto>> {
    return this.http.post<ApiResponse<SaleFolderDto>>(this.API_URL, body);
  }

  update(id: string, body: UpdateSaleFolderDto): Observable<ApiResponse<SaleFolderDto>> {
    return this.http.put<ApiResponse<SaleFolderDto>>(`${this.API_URL}/${id}`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  addSales(id: string, body: AddSalesToFolderDto): Observable<ApiResponse<SaleFolderDto>> {
    return this.http.post<ApiResponse<SaleFolderDto>>(`${this.API_URL}/${id}/sales`, body);
  }

  removeSale(id: string, saleId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}/sales/${saleId}`);
  }

  reorder(id: string, body: ReorderFolderSalesDto): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/${id}/sales/reorder`, body);
  }
}
