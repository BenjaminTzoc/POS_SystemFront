import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../core/models/api-response.model';
import { IRecipeIngredient, ICreateRecipeIngredient, IRecipeResponse } from '../interfaces/recipe.interface';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/production/recipes`;

  getRecipeByProduct(productId: string): Observable<ApiResponse<IRecipeIngredient[]>> {
    return this.http.get<ApiResponse<IRecipeIngredient[]>>(`${this.API_URL}/${productId}`);
  }

  addIngredient(data: ICreateRecipeIngredient): Observable<ApiResponse<IRecipeIngredient>> {
    return this.http.post<ApiResponse<IRecipeIngredient>>(this.API_URL, data);
  }

  removeIngredient(ingredientId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${ingredientId}`);
  }

  updateIngredient(ingredientId: string, data: Partial<ICreateRecipeIngredient>): Observable<ApiResponse<IRecipeIngredient>> {
    return this.http.patch<ApiResponse<IRecipeIngredient>>(`${this.API_URL}/${ingredientId}`, data);
  }
}
