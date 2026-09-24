import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ISaleReceiptsData, ISingleReceiptData } from '../interfaces/sale-payment.interface';

@Injectable({
  providedIn: 'root',
})
export class SalePaymentsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/sale-payment`;

  createSalePayment(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, body);
  }

  getSalePayments(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}`);
  }

  /**
   * Obtiene todos los abonos y saldos de una orden de venta
   * GET /api/v1/sale-payment/sale/:saleId/receipt
   */
  getSaleReceipts(saleId: string): Observable<ApiResponse<ISaleReceiptsData>> {
    return this.http.get<ApiResponse<ISaleReceiptsData>>(`${this.API_URL}/sale/${saleId}/receipt`);
  }

  /**
   * PDF consolidado de recibos de abono de una orden
   * GET /api/v1/sale-payment/sale/:saleId/receipt/pdf
   */
  getSaleReceiptPdf(saleId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/sale/${saleId}/receipt/pdf`, {
      responseType: 'blob',
    });
  }

  /**
   * Obtiene los datos del recibo para un abono individual específico
   * GET /api/v1/sale-payment/receipt/:id
   */
  getReceiptById(receiptId: string): Observable<ApiResponse<ISingleReceiptData>> {
    return this.http.get<ApiResponse<ISingleReceiptData>>(`${this.API_URL}/receipt/${receiptId}`);
  }
}

