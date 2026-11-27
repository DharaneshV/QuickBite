import { Routes } from '@angular/router';
import { authGuard, profileCompleteGuard, roleGuard } from '../../core/guards/auth.guard';

export const productRoutes: Routes = [
  {
    path: 'products',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () =>
      import('./product-list/product-list').then((m) => m.ProductListComponent),
  },
  {
    path: 'products/manage',
    canActivate: [roleGuard('Admin')],
    loadComponent: () =>
      import('./product-management/product-management').then(
        (m) => m.ProductManagementComponent
      ),
  },
  {
    path: 'products/:id',
    canActivate: [authGuard, profileCompleteGuard],
    loadComponent: () =>
      import('./product-details/product-details').then(
        (m) => m.ProductDetailsComponent
      ),
  },
];

