import { Routes } from '@angular/router';

import { authRoutes } from './features/auth/auth.routes';
import { catalogRoutes } from './features/catalog/catalog.routes';

export const routes: Routes = [
  ...authRoutes,
  ...catalogRoutes,
];
