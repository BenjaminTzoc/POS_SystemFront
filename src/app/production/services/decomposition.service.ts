import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { ICreateDecomposition, IDecompositionResponse } from '../interfaces/decomposition.interface';

@Injectable({
  providedIn: 'root'
})
export class DecompositionService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/production/decomposition`;

  getDecompositions(): Observable<ApiResponse<IDecompositionResponse[]>> {
    return this.http.get<ApiResponse<IDecompositionResponse[]>>(this.API_URL);
  }

  getDecomposition(id: string): Observable<ApiResponse<IDecompositionResponse>> {
    return this.http.get<ApiResponse<IDecompositionResponse>>(`${this.API_URL}/${id}`);
  }

  createDecomposition(data: ICreateDecomposition): Observable<ApiResponse<IDecompositionResponse>> {
    return this.http.post<ApiResponse<IDecompositionResponse>>(this.API_URL, data);
  }
}
