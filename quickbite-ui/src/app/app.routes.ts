import { Routes } from '@angular/router';

import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { catalogRoutes } from './features/catalog/catalog.routes';
import { checkoutRoutes } from './features/checkout/checkout.routes';
import { orderRoutes } from './features/orders/orders.routes';
import { productRoutes } from './features/products/products.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  ...authRoutes,
  ...catalogRoutes,
  ...productRoutes,
  ...checkoutRoutes,
  ...orderRoutes,
  ...adminRoutes,
];
