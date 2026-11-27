import { Routes } from '@angular/router';

export const catalogRoutes: Routes = [
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/categories').then((m) => m.CategoriesComponent),
  },
  {
    path: 'brands',
    loadComponent: () =>
      import('./brands/brands').then((m) => m.BrandsComponent),
  },
];

