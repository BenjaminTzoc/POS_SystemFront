import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { InventoryMovement } from '../interfaces/inventory-movement.interface';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryMovementsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventory-movements`;

  getInventoryMovements(filters?: any): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.API_URL}`, { params: filters });
  }

  getMovementById(id: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.get<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}`);
  }

  createInventoryMovement(body: any): Observable<ApiResponse<InventoryMovement>> {
    return this.http.post<ApiResponse<InventoryMovement>>(`${this.API_URL}`, body);
  }

  createTransfer(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/transfer`, body);
  }

  completeInventoryMovement(id: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.patch<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}/complete`, {});
  }

  completeTransfer(referenceId: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/transfer/${referenceId}/complete`, {});
  }

  cancelInventoryMovement(id: string, reason: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.patch<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}/cancel`, {
      reason,
    });
  }

  getStats(branchId?: string): Observable<ApiResponse<any>> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/stats`, { params });
  }

  updateMovement(id: string, body: any): Observable<ApiResponse<InventoryMovement>> {
    return this.http.put<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}`, body);
  }

  deleteMovement(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${id}`);
  }

  restoreMovement(id: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.patch<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}/restore`, {});
  }

  getByProduct(productId: string): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.API_URL}/product/${productId}`);
  }

  getByBranch(branchId: string): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.API_URL}/branch/${branchId}`);
  }

  getByType(type: string): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.API_URL}/type/${type}`);
  }
}
