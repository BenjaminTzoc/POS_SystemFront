import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  InventoryTransfer,
  InventoryTransferResponse,
  CreateInventoryTransferDto,
  TransferStatus,
  UpdateTransferStatusDto,
} from '../interfaces/inventory-transfer.interface';

@Injectable({
  providedIn: 'root',
})
export class InventoryTransfersService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventory-transfers`;

  getTransfers(filters?: {
    originBranchId?: string;
    destinationBranchId?: string;
    status?: TransferStatus;
    startDate?: string;
    endDate?: string;
  }): Observable<InventoryTransferResponse> {
    let params = new HttpParams();
    if (filters?.originBranchId) params = params.set('originBranchId', filters.originBranchId);
    if (filters?.destinationBranchId)
      params = params.set('destinationBranchId', filters.destinationBranchId);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.startDate) params = params.set('startDate', filters.startDate);
    if (filters?.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<InventoryTransferResponse>(this.apiUrl, { params });
  }

  getTransferById(id: string): Observable<{ data: InventoryTransfer }> {
    return this.http.get<{ data: InventoryTransfer }>(`${this.apiUrl}/${id}`);
  }

  createTransfer(dto: CreateInventoryTransferDto): Observable<InventoryTransfer> {
    return this.http.post<InventoryTransfer>(this.apiUrl, dto);
  }

  updateStatus(id: string, status: TransferStatus): Observable<InventoryTransfer> {
    const dto: UpdateTransferStatusDto = { status };
    return this.http.patch<InventoryTransfer>(`${this.apiUrl}/${id}/status`, dto);
  }
}
