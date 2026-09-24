import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const pilotoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: '/piloto' } });
    return false;
  }

  if (!auth.isPilot) {
    router.navigateByUrl(auth.postLoginRoute);
    return false;
  }

  return true;
};
