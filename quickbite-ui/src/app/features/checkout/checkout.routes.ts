import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const checkoutRoutes: Routes = [
  {
    path: 'cart',
    loadComponent: () => import('../cart/cart').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./checkout').then((m) => m.CheckoutComponent),
  },
];
