import { Routes } from '@angular/router';

import { authRoutes } from './features/auth/auth.routes';
import { catalogRoutes } from './features/catalog/catalog.routes';
import { productRoutes } from './features/products/products.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  ...authRoutes,
  ...catalogRoutes,
  ...productRoutes,
];
