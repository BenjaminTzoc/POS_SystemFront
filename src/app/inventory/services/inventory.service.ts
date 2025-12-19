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

  deleteInventory(inventoryId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/${inventoryId}`);
  }
}
