import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';
import { ProfileService } from '../../features/auth/profile.service';

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

export const profileCompleteGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  const user = authService.currentUser();
  if (!user || !authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (authService.isAdmin() || profileService.isProfileComplete(user.userId)) {
    return true;
  }

  return router.createUrlTree(['/profile'], {
    queryParams: { returnUrl: state.url },
  });
};

export const homeRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const profileService = inject(ProfileService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.isAdmin()) {
    return router.createUrlTree(['/admin']);
  }

  const user = authService.currentUser();
  if (user && !profileService.isProfileComplete(user.userId)) {
    return router.createUrlTree(['/profile']);
  }

  return router.createUrlTree(['/products']);
};
