import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import {
  CashSession,
  OpenCashRequest,
  CloseCashRequest,
} from '../interfaces/cash-register.interface';

@Injectable({
  providedIn: 'root',
})
export class CashRegisterService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/cash-registers`;

  // Estado global reactivo
  currentSession = signal<CashSession | null>(null);

  /**
   * Verifica si el usuario actual tiene una caja abierta
   */
  getStatus(): Observable<ApiResponse<CashSession | null>> {
    return this.http.get<ApiResponse<CashSession | null>>(`${this.API_URL}/status`).pipe(
      tap((res) => this.currentSession.set(res.data))
    );
  }

  /**
   * Abre una nueva sesión de caja
   */
  open(request: OpenCashRequest): Observable<ApiResponse<CashSession>> {
    return this.http.post<ApiResponse<CashSession>>(`${this.API_URL}/open`, request).pipe(
      tap((res) => this.currentSession.set(res.data))
    );
  }

  /**
   * Cierra la sesión de caja actual
   */
  close(id: string, request: CloseCashRequest): Observable<ApiResponse<CashSession>> {
    return this.http.post<ApiResponse<CashSession>>(`${this.API_URL}/close/${id}`, request).pipe(
      tap(() => this.currentSession.set(null))
    );
  }

  /**
   * Obtiene el historial de cajas
   */
  getHistory(filters?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<ApiResponse<CashSession[]>> {
    let params: any = {};
    if (filters) {
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
    }
    return this.http.get<ApiResponse<CashSession[]>>(`${this.API_URL}/history`, { params });
  }
}
