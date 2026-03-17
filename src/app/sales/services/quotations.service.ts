import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IQuotation,
  IQuotationResponse,
  IQuotationDetailResponse,
  IQuotationConvertResponse,
  CreateQuotationDto,
  QuotationStatus,
} from '../interfaces/quotation.interface';

@Injectable({
  providedIn: 'root',
})
export class QuotationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/quotations`;

  getQuotations(filters?: {
    status?: QuotationStatus;
    customerId?: string;
    branchId?: string;
    search?: string;
  }): Observable<IQuotationResponse> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.customerId) params = params.set('customerId', filters.customerId);
    if (filters?.branchId) params = params.set('branchId', filters.branchId);
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<IQuotationResponse>(this.apiUrl, { params });
  }

  getQuotationById(id: string): Observable<IQuotationDetailResponse> {
    return this.http.get<IQuotationDetailResponse>(`${this.apiUrl}/${id}`);
  }

  createQuotation(dto: CreateQuotationDto): Observable<IQuotationDetailResponse> {
    return this.http.post<IQuotationDetailResponse>(this.apiUrl, dto);
  }

  updateStatus(id: string, status: QuotationStatus): Observable<IQuotationDetailResponse> {
    return this.http.patch<IQuotationDetailResponse>(`${this.apiUrl}/${id}/status`, { status });
  }

  convertToSale(id: string): Observable<IQuotationConvertResponse> {
    return this.http.post<IQuotationConvertResponse>(`${this.apiUrl}/${id}/convert`, {});
  }
}
