import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/guards/auth.guard';

export const orderRoutes: Routes = [
  {
    path: 'orders/my',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./my-orders/my-orders').then((m) => m.MyOrdersComponent),
  },
  {
    path: 'orders/manage',
    canActivate: [roleGuard('Admin')],
    loadComponent: () =>
      import('./order-management/order-management').then(
        (m) => m.OrderManagementComponent
      ),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./order-details/order-details').then(
        (m) => m.OrderDetailsComponent
      ),
  },
];

