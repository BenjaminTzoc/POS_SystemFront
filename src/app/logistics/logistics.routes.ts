import { Routes } from '@angular/router';
import { AreasComponent } from './pages/areas/areas.component';

export const LOGISTICS_ROUTES: Routes = [
  {
    path: 'areas',
    component: AreasComponent,
  },
  {
    path: 'new-area',
    loadComponent: () => import('./pages/areas/area-form/area-form.component').then(m => m.AreaFormComponent),
  },
  {
    path: 'edit-area/:id',
    loadComponent: () => import('./pages/areas/area-form/area-form.component').then(m => m.AreaFormComponent),
  },
  {
    path: 'dispatches',
    loadComponent: () => import('./pages/dispatches/dispatches.component').then(m => m.DispatchesComponent),
  },
  {
    path: 'new-dispatch',
    loadComponent: () => import('./pages/dispatches/dispatch-form/dispatch-form.component').then(m => m.DispatchFormComponent),
  },
  {
    path: 'edit-dispatch/:id',
    loadComponent: () => import('./pages/dispatches/dispatch-form/dispatch-form.component').then(m => m.DispatchFormComponent),
  },
  {
    path: 'dispatches/receive/:id',
    loadComponent: () => import('./pages/dispatches/dispatch-receive/dispatch-receive.component').then(m => m.DispatchReceiveComponent),
  },
  {
    path: 'dispatches/liquidate/:id',
    loadComponent: () => import('./pages/dispatches/dispatch-liquidate/dispatch-liquidate.component').then(m => m.DispatchLiquidateComponent),
  },
  {
    path: 'dispatches/detail/:id',
    loadComponent: () => import('./pages/dispatches/dispatch-detail/dispatch-detail.component').then(m => m.RouteDispatchDetailComponent),
  },
  {
    path: 'returns',
    loadComponent: () => import('./pages/returns/returns.component').then(m => m.ReturnsComponent),
  },
  {
    path: 'settlements',
    loadComponent: () => import('./pages/settlements/settlements.component').then(m => m.SettlementsComponent),
  },
];
