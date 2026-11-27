import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';
import { AdminLayoutComponent } from './admin-layout/admin-layout';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard('Admin')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('../products/product-management/product-management').then(
            (m) => m.ProductManagementComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../catalog/categories/categories').then(
            (m) => m.CategoriesComponent
          ),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('../catalog/brands/brands').then((m) => m.BrandsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('../orders/order-management/order-management').then(
            (m) => m.OrderManagementComponent
          ),
      },
    ],
  },
];

