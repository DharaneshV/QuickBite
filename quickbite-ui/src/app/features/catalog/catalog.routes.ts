import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

export const catalogRoutes: Routes = [
  {
    path: 'categories',
    canActivate: [roleGuard('Admin')],
    loadComponent: () =>
      import('./categories/categories').then((m) => m.CategoriesComponent),
  },
  {
    path: 'brands',
    canActivate: [roleGuard('Admin')],
    loadComponent: () =>
      import('./brands/brands').then((m) => m.BrandsComponent),
  },
];
