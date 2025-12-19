import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiResponse } from '../core/models/api-response.model';
import { User } from '../core/models/user.model';
import { AuthResponse, LoginRequest } from '../core/models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = environment.apiUrl;

  private authSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.authSubject.asObservable();

  constructor() {
    this.checkTokenExpiration();
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.statusCode === 200 && response.data?.accessToken) {
            this.setAuthData(response.data);
            this.authSubject.next(response.data.user ?? null);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    this.authSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permissionName: string): boolean {
    const user = this.authSubject.value;
    if (!user) return false;

    // Si es superadmin, tiene todos los permisos
    if (user.roles?.some((r) => r.isSuperAdmin)) return true;

    // Buscar permiso en los permisos directos del usuario
    const hasDirectPermission = user.permissions?.some((perm) => perm.name === permissionName);

    // Buscar permiso en los permisos del rol
    const hasRolePermission = user.roles?.some((role) =>
      role.permissions?.some((perm) => perm.name === permissionName)
    );

    return hasDirectPermission || hasRolePermission;
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (!permissions || permissions.length === 0) return true;
    return permissions.some((permission) => this.hasPermission(permission));
  }

  private setAuthData(authData: AuthResponse): void {
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  get token(): string | null {
    return localStorage.getItem('accessToken');
  }

  get isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;

    try {
      const decodedToken: any = jwtDecode(token);

      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logout();
      return false;
    }
  }

  getTokenData(): any {
    const token = this.token;
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }

  private checkTokenExpiration(): void {
    if (this.token && !this.isAuthenticated) {
      this.logout();
    }
  }

  get currentUser(): User | null {
    return this.authSubject.value;
  }
}
