import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';

export interface CompanySetting {
  id?: string;
  companyName: string;
  address: string;
  phone: string;
  nit: string;
  logoUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CompanySettingService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/company-settings`;

  getSettings(): Observable<ApiResponse<CompanySetting>> {
    return this.http.get<ApiResponse<CompanySetting>>(`${this.API_URL}`);
  }

  updateSettings(settings: Partial<CompanySetting>): Observable<ApiResponse<CompanySetting>> {
    return this.http.put<ApiResponse<CompanySetting>>(`${this.API_URL}`, settings);
  }
}
