import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardSummaryDto,
  SalesTrendDto,
  ProductPerformanceReportDto,
  CategorySalesReportDto,
  BranchPerformanceReportDto,
  CriticalStockDto,
  UnifiedDashboardDto,
  HourlySalesDto,
  OrderSummaryReportDto,
  DashboardCalendarDto,
  WeeklyConsolidationItemDto,
  WeeklyConsolidationBranchDto,
  ProductConsolidationItemDto,
  CustomerConsolidationItemDto,
  WeeklyDataConsolidationDto,
  ProductMonthlyTrendDto
} from '../models/reports.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getUnifiedDashboard(
    branchId?: string,
    days: number = 7,
    startDate?: string,
    endDate?: string,
  ): Observable<ApiResponse<UnifiedDashboardDto>> {
    let params = new HttpParams().set('days', days.toString());
    if (branchId) params = params.set('branchId', branchId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<ApiResponse<UnifiedDashboardDto>>(`${this.apiUrl}/dashboard`, { params });
  }

  getOrderSummary(branchId?: string): Observable<ApiResponse<OrderSummaryReportDto>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<OrderSummaryReportDto>>(`${this.apiUrl}/orders/summary`, { params });
  }

  getDashboardCalendar(
    month?: number,
    year?: number,
    branchId?: string
  ): Observable<ApiResponse<DashboardCalendarDto>> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<ApiResponse<DashboardCalendarDto>>(`${this.apiUrl}/dashboard/calendar`, {
      params,
    });
  }

  getWeeklyConsolidation(
    month?: number,
    year?: number,
    branchId?: string
  ): Observable<ApiResponse<WeeklyConsolidationBranchDto[]>> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<ApiResponse<WeeklyConsolidationBranchDto[]>>(
      `${this.apiUrl}/branches/weekly-consolidation`,
      { params }
    );
  }

  getProductsWeeklyConsolidation(
    weekStartDate: string,
    branchId?: string
  ): Observable<ApiResponse<WeeklyDataConsolidationDto<ProductConsolidationItemDto>>> {
    let params = new HttpParams().set('weekStartDate', weekStartDate);
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<ApiResponse<WeeklyDataConsolidationDto<ProductConsolidationItemDto>>>(
      `${this.apiUrl}/products/weekly-consolidation`,
      { params }
    );
  }

  getCustomersWeeklyConsolidation(
    weekStartDate: string,
    branchId?: string
  ): Observable<ApiResponse<WeeklyDataConsolidationDto<CustomerConsolidationItemDto>>> {
    let params = new HttpParams().set('weekStartDate', weekStartDate);
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<ApiResponse<WeeklyDataConsolidationDto<CustomerConsolidationItemDto>>>(
      `${this.apiUrl}/customers/weekly-consolidation`,
      { params }
    );
  }

  getProductMonthlyTrends(
    month?: number,
    year?: number,
    branchId?: string,
    page: number = 1,
    limit: number = 5
  ): Observable<ApiResponse<ProductMonthlyTrendDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (month) params = params.set('month', month.toString());
    if (year) params = params.set('year', year.toString());
    if (branchId) params = params.set('branchId', branchId);

    return this.http.get<ApiResponse<ProductMonthlyTrendDto>>(
      `${this.apiUrl}/products/monthly-trends`,
      { params }
    );
  }
}
