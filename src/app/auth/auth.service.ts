import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ApiResponse } from '../core/models/api-response.model';
import { User } from '../core/models/user.model';
import { AuthResponse, LoginRequest, MenuResponse } from '../core/models/auth.model';
import { MenuItem } from '../layout/sidebar/menu-items';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = environment.apiUrl;

  private authSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public user$ = this.authSubject.asObservable();

  public recurrentMenuSignal = signal<MenuItem[]>(this.getMenuFromStorage().recurrent);
  public mainMenuSignal = signal<MenuItem[]>(this.getMenuFromStorage().main);

  constructor() {
    console.log('AuthService: Inicializando...');
    this.checkTokenExpiration();
    this.loadMenu();
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/users/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.statusCode === 200 && response.data?.accessToken) {
            this.setAuthData(response.data);
            this.authSubject.next(response.data.user ?? null);
            this.loadMenu();
          }
        })
      );
  }

  loadMenu(): void {
    console.log('AuthService: Intentando cargar menú...', { isAuthenticated: this.isAuthenticated });
    if (!this.isAuthenticated) return;
    this.http.get<ApiResponse<MenuResponse>>(`${this.API_URL}/users/profile/menu`).subscribe({
      next: (res) => {
        console.log('AuthService: Menú cargado con éxito', res.data);
        this.saveMenuToStorage(res.data);
        this.recurrentMenuSignal.set(res.data.recurrent);
        this.mainMenuSignal.set(res.data.main);
      },
      error: (err) => console.error('AuthService: Error cargando menú', err)
    });
  }

  private saveMenuToStorage(menu: MenuResponse): void {
    localStorage.setItem('sidebarMenu', JSON.stringify(menu));
  }

  private getMenuFromStorage(): MenuResponse {
    const menuStr = localStorage.getItem('sidebarMenu');
    return menuStr ? JSON.parse(menuStr) : { recurrent: [], main: [] };
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sidebarMenu');
    this.authSubject.next(null);
    this.recurrentMenuSignal.set([]);
    this.mainMenuSignal.set([]);
    this.router.navigate(['/auth/login']);
  }

  hasPermission(permissionName: string): boolean {
    const user = this.authSubject.value;
    if (!user) return false;

    // Si es superadmin, tiene todos los permisos
    if (user.roles?.some((r) => typeof r !== 'string' && r.isSuperAdmin)) return true;

    const hasDirectPermission = user.permissions?.some((perm) => perm.name === permissionName);

    const hasRolePermission = user.roles?.some(
      (role) => typeof role !== 'string' && role.permissions?.some((perm) => perm.name === permissionName)
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

  get isSuperAdmin(): boolean {
    return this.currentUser?.roles?.some((role) => typeof role !== 'string' && role.isSuperAdmin) ?? false;
  }

  get isPilot(): boolean {
    const user = this.currentUser;
    if (!user || this.isSuperAdmin) return false;

    const labels = this.collectRoleLabels(user);
    if (labels.some((name) => this.looksLikePilotRole(name))) return true;

    const email = user.email?.toLowerCase() ?? '';
    return email === 'piloto@pos.com' || email.startsWith('piloto@');
  }

  get postLoginRoute(): string {
    return this.isPilot ? '/piloto' : '/dashboard';
  }

  resolvePostLoginRoute(returnUrl?: string | null): string {
    if (this.isPilot) {
      return returnUrl?.startsWith('/piloto') ? returnUrl : '/piloto';
    }
    if (returnUrl?.startsWith('/piloto')) return '/dashboard';
    return returnUrl || '/dashboard';
  }

  private collectRoleLabels(user: User): string[] {
    const labels: string[] = [];
    const push = (value: unknown) => {
      if (typeof value === 'string' && value.trim()) {
        labels.push(value);
        return;
      }
      if (value && typeof value === 'object') {
        const role = value as { name?: string; code?: string; slug?: string };
        for (const key of [role.name, role.code, role.slug]) {
          if (typeof key === 'string' && key.trim()) labels.push(key);
        }
      }
    };

    (user.roles ?? []).forEach(push);

    const token = this.getTokenData();
    if (Array.isArray(token?.roles)) token.roles.forEach(push);
    else push(token?.roles);
    push(token?.role);

    return labels;
  }

  private looksLikePilotRole(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return ['piloto', 'pilot', 'chofer', 'conductor', 'driver'].some(
      (keyword) => normalized === keyword || normalized.includes(keyword)
    );
  }
}
