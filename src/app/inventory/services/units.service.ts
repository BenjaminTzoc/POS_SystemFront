import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { UnitMeasure } from '../interfaces/unit.interface';

@Injectable({
  providedIn: 'root',
})
export class UnitsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/units`;

  getUnits(includeDeleted: boolean = false): Observable<ApiResponse<UnitMeasure[]>> {
    let params = new HttpParams();
    if (includeDeleted) {
      params = params.set('includeDeleted', 'true');
    }
    return this.http.get<ApiResponse<UnitMeasure[]>>(`${this.API_URL}`, { params });
  }

  getUnit(idUnit: string): Observable<ApiResponse<UnitMeasure>> {
    return this.http.get<ApiResponse<UnitMeasure>>(`${this.API_URL}/${idUnit}`);
  }

  createUnit(unit: Partial<UnitMeasure>): Observable<ApiResponse<UnitMeasure>> {
    return this.http.post<ApiResponse<UnitMeasure>>(`${this.API_URL}`, unit);
  }

  updateUnit(idUnit: string, unit: Partial<UnitMeasure>): Observable<ApiResponse<UnitMeasure>> {
    return this.http.put<ApiResponse<UnitMeasure>>(`${this.API_URL}/${idUnit}`, unit);
  }

  deleteUnit(idUnit: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${idUnit}`);
  }

  restoreUnit(idUnit: string): Observable<ApiResponse<UnitMeasure>> {
    return this.http.patch<ApiResponse<UnitMeasure>>(`${this.API_URL}/${idUnit}/restore`, {});
  }
}
