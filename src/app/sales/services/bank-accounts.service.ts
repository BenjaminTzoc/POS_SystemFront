import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { IBankAccount } from '../interfaces/bank-account.interface';

@Injectable({
  providedIn: 'root',
})
export class BankAccountsService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/bank-accounts`;

  getBankAccounts(): Observable<ApiResponse<IBankAccount[]>> {
    return this.http.get<ApiResponse<IBankAccount[]>>(`${this.API_URL}`);
  }

  createBankAccount(body: any): Observable<ApiResponse<IBankAccount>> {
    return this.http.post<ApiResponse<IBankAccount>>(`${this.API_URL}`, body);
  }

  updateBankAccount(id: string, body: any): Observable<ApiResponse<IBankAccount>> {
    return this.http.put<ApiResponse<IBankAccount>>(`${this.API_URL}/${id}`, body);
  }

  deleteBankAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
