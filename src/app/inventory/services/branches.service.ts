import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { Branch } from '../interfaces/branch.interface';

@Injectable({
  providedIn: 'root',
})
export class BranchesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/branches`;

  getBranches(filters: { isPlant?: boolean, includeDeleted?: boolean } | boolean = {}): Observable<ApiResponse<Branch[]>> {
    let params = new HttpParams();
    
    if (typeof filters === 'boolean') {
      params = params.set('includeDeleted', filters.toString());
    } else {
      if (filters.includeDeleted !== undefined) {
        params = params.set('includeDeleted', filters.includeDeleted.toString());
      }
      if (filters.isPlant !== undefined) {
        params = params.set('isPlant', filters.isPlant.toString());
      }
    }
    
    return this.http.get<ApiResponse<Branch[]>>(`${this.API_URL}`, { params });
  }

  getBranch(id: string): Observable<ApiResponse<Branch>> {
    return this.http.get<ApiResponse<Branch>>(`${this.API_URL}/${id}`);
  }

  createBranch(body: any): Observable<ApiResponse<Branch>> {
    return this.http.post<ApiResponse<Branch>>(`${this.API_URL}`, body);
  }

  updateBranch(id: string, body: any): Observable<ApiResponse<Branch>> {
    return this.http.put<ApiResponse<Branch>>(`${this.API_URL}/${id}`, body);
  }

  deleteBranch(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }

  restoreBranch(id: string): Observable<ApiResponse<Branch>> {
    return this.http.patch<ApiResponse<Branch>>(`${this.API_URL}/${id}/restore`, {});
  }
}
