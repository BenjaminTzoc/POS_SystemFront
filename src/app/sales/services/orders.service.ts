import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ISaleOrderResponse, ISaleDetailResponse, ISaleGroupedByStatus, ISaleGroupedByPreparation } from '../interfaces/sale-order.interface';

export interface SaleFilterDto {
  groupBy?: 'status' | 'preparationStatus';
  areaId?: string;
  onlyAreaDetails?: boolean;
  branchId?: string | null;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sales`;

  getSales(filters: SaleFilterDto = {}): Observable<ApiResponse<ISaleOrderResponse[] | ISaleGroupedByStatus | ISaleGroupedByPreparation>> {
    const params = this.buildParams(filters);
    return this.http.get<ApiResponse<ISaleOrderResponse[] | ISaleGroupedByStatus | ISaleGroupedByPreparation>>(`${this.API_URL}`, { params });
  }

  getSalesTable(filters: SaleFilterDto = {}): Observable<ApiResponse<PaginatedResponse<ISaleOrderResponse>>> {
    const params = this.buildParams(filters);
    return this.http.get<ApiResponse<PaginatedResponse<ISaleOrderResponse>>>(`${this.API_URL}/table`, { params });
  }

  getSalesKanban(filters: SaleFilterDto = {}): Observable<ApiResponse<ISaleGroupedByStatus | ISaleGroupedByPreparation>> {
    const params = this.buildParams(filters);
    return this.http.get<ApiResponse<ISaleGroupedByStatus | ISaleGroupedByPreparation>>(`${this.API_URL}/kanban`, { params });
  }

  private buildParams(filters: SaleFilterDto): HttpParams {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.areaId) params = params.set('areaId', filters.areaId);
    if (filters.onlyAreaDetails !== undefined) params = params.set('onlyAreaDetails', filters.onlyAreaDetails);
    if (filters.groupBy) params = params.set('groupBy', filters.groupBy);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    return params;
  }

  preparingSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.patch<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}`, { status: 'preparing' });
  }

  readyForPickupSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.patch<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}`, { status: 'ready_for_pickup' });
  }

  getSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.get<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}`);
  }

  getNextInvoiceNumber(): Observable<ApiResponse<{ nextNumber: string }>> {
    return this.http.get<ApiResponse<{ nextNumber: string }>>(`${this.API_URL}/next-number`);
  }

  createSale(body: any): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.post<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}`, body);
  }

  confirmSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.post<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}/confirm`, {});
  }

  deliverSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.post<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}/deliver`, {});
  }

  cancelSale(saleId: string): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.post<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}/cancel`, {});
  }

  updateSale(saleId: string, body: any): Observable<ApiResponse<ISaleOrderResponse>> {
    return this.http.put<ApiResponse<ISaleOrderResponse>>(`${this.API_URL}/${saleId}`, body);
  }

  sendTicketByEmail(saleId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${saleId}/send-email`, {});
  }

  updateDetailStatus(detailId: string, status: 'preparing' | 'completed'): Observable<ApiResponse<ISaleDetailResponse>> {
    return this.http.patch<ApiResponse<ISaleDetailResponse>>(`${environment.apiUrl}/sales/details/${detailId}/status`, { status });
  }
}
