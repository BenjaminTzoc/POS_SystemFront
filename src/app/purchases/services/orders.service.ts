import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { CreatePurchase, IPurchaseOrderResponse } from '../interfaces/purchase-order.interface';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/purchases`;

  getPurchases(): Observable<ApiResponse<IPurchaseOrderResponse[]>> {
    return this.http.get<ApiResponse<IPurchaseOrderResponse[]>>(`${this.API_URL}`);
  }

  createPurchase(formData: CreatePurchase): Observable<ApiResponse<IPurchaseOrderResponse>> {
    return this.http.post<ApiResponse<IPurchaseOrderResponse>>(`${this.API_URL}`, formData);
  }

  getNextInvoiceNumber(): Observable<ApiResponse<{ nextNumber: string }>> {
    return this.http.get<ApiResponse<{ nextNumber: string }>>(`${this.API_URL}/next-number`);
  }

  getPurchase(purchaseId: string): Observable<ApiResponse<IPurchaseOrderResponse>> {
    return this.http.get<ApiResponse<IPurchaseOrderResponse>>(`${this.API_URL}/${purchaseId}`);
  }

  receiveStock(purchaseId: string, branchId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.API_URL}/${purchaseId}/receive`,
      { branchId },
    );
  }
}
