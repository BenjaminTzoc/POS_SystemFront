import { HttpClient } from '@angular/common/http';
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

  getUnits(): Observable<ApiResponse<UnitMeasure[]>> {
    return this.http.get<ApiResponse<UnitMeasure[]>>(`${this.API_URL}`);
  }

  getUnit(idUnit: string): Observable<ApiResponse<UnitMeasure>> {
    return this.http.get<ApiResponse<UnitMeasure>>(`${this.API_URL}/${idUnit}`);
  }
}
