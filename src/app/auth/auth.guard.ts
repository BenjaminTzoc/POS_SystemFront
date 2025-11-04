import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = authService.isAuthenticated;

  if (!isAuthenticated) {
    // permitir acceder al login
    if (state.url.includes('/auth/login')) {
      return true;
    }

    // redirigir a login con returnUrl
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // permitir rutas protegidas
  const requiredPermissions = route.data?.['permissions'] as string[];
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = authService.hasAnyPermission(requiredPermissions);
    if (!hasPermission) {
      router.navigate(['/unauthorized']);
      return false;
    }
  }

  // bloquear acceso al login si ya está autenticado
  if (state.url.includes('/auth/login')) {
    router.navigateByUrl('/dashboard');
    return false;
  }

  return true;
};
