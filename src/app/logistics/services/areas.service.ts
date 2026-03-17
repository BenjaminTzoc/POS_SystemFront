import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { Area } from '../interfaces/area.interface';

@Injectable({
  providedIn: 'root',
})
export class AreasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/logistics/areas`;

  getAreas(includeDeleted: boolean = false): Observable<ApiResponse<Area[]>> {
    let params = new HttpParams();
    if (includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }
    return this.http.get<ApiResponse<Area[]>>(`${this.API_URL}`, { params });
  }

  getArea(id: string, includeDeleted: boolean = false): Observable<ApiResponse<Area>> {
    let params = new HttpParams();
    if (includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }
    return this.http.get<ApiResponse<Area>>(`${this.API_URL}/${id}`, { params });
  }

  createArea(body: Partial<Area>): Observable<ApiResponse<Area>> {
    return this.http.post<ApiResponse<Area>>(`${this.API_URL}`, body);
  }

  updateArea(id: string, body: Partial<Area>): Observable<ApiResponse<Area>> {
    return this.http.patch<ApiResponse<Area>>(`${this.API_URL}/${id}`, body);
  }

  deleteArea(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  restoreArea(id: string): Observable<ApiResponse<Area>> {
    return this.http.patch<ApiResponse<Area>>(`${this.API_URL}/${id}/restore`, {});
  }
}
