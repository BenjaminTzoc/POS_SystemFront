import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { Branch } from '../interfaces/branch.interface';

@Injectable({
  providedIn: 'root'
})
export class BranchesService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/branches`;

  getBranches(): Observable<ApiResponse<Branch[]>> {
    return this.http.get<ApiResponse<Branch[]>>(`${this.API_URL}`);
  }
}
