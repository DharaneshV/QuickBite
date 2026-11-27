import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

function checkAccess(allowedRoles: readonly string[] | undefined, returnUrl: string) {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl },
    });
  }

  if (allowedRoles && allowedRoles.length > 0 && !authService.hasRole(allowedRoles)) {
    return router.createUrlTree(['/']);
  }

  return true;
}

export const authGuard: CanActivateFn = (route, state) => {
  const roles = route.data?.['roles'] as readonly string[] | undefined;
  return checkAccess(roles, state.url);
};

export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return (_route, state) => checkAccess(allowedRoles, state.url);
}
