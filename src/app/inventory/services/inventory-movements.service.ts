import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { InventoryMovement } from '../interfaces/inventory-movement.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryMovementsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventory-movements`;

  getInventoryMovements(): Observable<ApiResponse<InventoryMovement[]>> {
    return this.http.get<ApiResponse<InventoryMovement[]>>(`${this.API_URL}`);
  }

  createInventoryMovement(body: any): Observable<ApiResponse<InventoryMovement>> {
    return this.http.post<ApiResponse<InventoryMovement>>(`${this.API_URL}`, body);
  }

  completeInventoryMovement(id: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.patch<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}/complete`, {});
  }

  cancelInventoryMovement(id: string, reason: string): Observable<ApiResponse<InventoryMovement>> {
    return this.http.patch<ApiResponse<InventoryMovement>>(`${this.API_URL}/${id}/cancel`, {
      reason,
    });
  }
}
