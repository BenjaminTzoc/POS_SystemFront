import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
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
}
