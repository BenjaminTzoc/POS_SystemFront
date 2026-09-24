import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api-response.model';
import { Inventory } from '../interfaces/inventory.interface';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/inventories`;

  getInventories(): Observable<ApiResponse<Inventory[]>> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.API_URL}`);
  }

  getInventoriesByBranch(branchId: string): Observable<ApiResponse<Inventory[]>> {
    return this.http.get<ApiResponse<Inventory[]>>(`${this.API_URL}/branch/${branchId}`);
  }

  createInventory(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}`, body);
  }

  updateInventory(
    inventoryId: string,
    body: Partial<{
      stock: number;
      minStock: number | null;
      maxStock: number | null;
      isAvailable: boolean;
    }>
  ): Observable<ApiResponse<Inventory>> {
    return this.http.put<ApiResponse<Inventory>>(`${this.API_URL}/${inventoryId}`, body);
  }

  createBulkInventories(body: {
    branchId: string;
    items: Array<{
      productId: string;
      stock: number;
      isAvailable?: boolean;
      minStock?: number | null;
      maxStock?: number | null;
    }>;
  }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/bulk`, body);
  }

  deleteInventory(inventoryId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${inventoryId}`);
  }

  getInventoryByProductAndBranch(productId: string, branchId: string): Observable<ApiResponse<Inventory>> {
    return this.http.get<ApiResponse<Inventory>>(`${environment.apiUrl}/inventories/product/${productId}/branch/${branchId}`);
  }
}
