import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardSummaryDto,
  SalesTrendDto,
  TopSellingProductDto,
  CategoryDistributionDto,
  PaymentMethodStatDto,
  HourlySalesDto,
  WeekdaySalesDto,
  InventoryMovementReportDto,
  ProfitReportDto,
} from '../models/reports.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getDashboardSummary(branchId?: string): Observable<ApiResponse<DashboardSummaryDto>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<DashboardSummaryDto>>(`${this.apiUrl}/dashboard/summary`, {
      params,
    });
  }

  getSalesTrends(
    days: number = 7,
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Observable<ApiResponse<SalesTrendDto[]>> {
    let params = new HttpParams().set('days', days);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<SalesTrendDto[]>>(`${this.apiUrl}/sales/trends`, { params });
  }

  getTopSellingProducts(
    limit: number = 5,
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Observable<ApiResponse<TopSellingProductDto[]>> {
    let params = new HttpParams().set('limit', limit);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<TopSellingProductDto[]>>(
      `${this.apiUrl}/products/top-selling`,
      { params },
    );
  }

  getCategoriesDistribution(branchId?: string): Observable<ApiResponse<CategoryDistributionDto[]>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<CategoryDistributionDto[]>>(
      `${this.apiUrl}/categories/distribution`,
      {
        params,
      },
    );
  }

  getPaymentMethodsStats(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Observable<ApiResponse<PaymentMethodStatDto[]>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<PaymentMethodStatDto[]>>(
      `${this.apiUrl}/sales/payment-methods`,
      {
        params,
      },
    );
  }

  getHourlySales(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Observable<ApiResponse<HourlySalesDto[]>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<HourlySalesDto[]>>(`${this.apiUrl}/sales/hourly`, { params });
  }

  getWeekdaySales(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Observable<ApiResponse<WeekdaySalesDto[]>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<WeekdaySalesDto[]>>(`${this.apiUrl}/sales/weekday`, {
      params,
    });
  }

  getInventoryMovements(
    days: number = 30,
    branchId?: string,
  ): Observable<ApiResponse<InventoryMovementReportDto[]>> {
    let params = new HttpParams().set('days', days);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<InventoryMovementReportDto[]>>(
      `${this.apiUrl}/inventory/movements`,
      { params },
    );
  }

  getProfitReport(
    days: number = 30,
    branchId?: string,
  ): Observable<ApiResponse<ProfitReportDto[]>> {
    let params = new HttpParams().set('days', days);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<ProfitReportDto[]>>(`${this.apiUrl}/financial/profit`, {
      params,
    });
  }
}
