import { Routes } from '@angular/router';
import { authGuard, profileCompleteGuard } from '../../core/guards/auth.guard';

export const checkoutRoutes: Routes = [
  {
    path: 'cart',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () => import('../cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () => import('./checkout').then((m) => m.CheckoutComponent),
  },
];
