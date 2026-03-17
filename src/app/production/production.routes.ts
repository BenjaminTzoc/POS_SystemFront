import { Routes } from '@angular/router';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: 'decomposition',
    children: [
      {
        path: '',
        loadComponent: () => import('./decomposition/decomposition-list/decomposition-list.component').then(m => m.DecompositionListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./decomposition/decomposition-form/decomposition-form.component').then(m => m.DecompositionFormComponent),
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./decomposition/decomposition-detail/decomposition-detail.component').then(m => m.DecompositionDetailComponent),
      }
    ]
  },
  {
    path: 'orders',
    children: [
      {
        path: '',
        loadComponent: () => import('./orders/order-list/order-list.component').then(m => m.ProductionOrderListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./orders/order-form/order-form.component').then(m => m.ProductionOrderFormComponent),
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./orders/order-detail/order-detail.component').then(m => m.ProductionOrderDetailComponent),
      }
    ]
  },
  {
    path: 'recipes',
    children: [
      {
        path: '',
        loadComponent: () => import('./recipes/recipe-list/recipe-list.component').then(m => m.RecipeListComponent),
      },
      {
        path: 'detail/:id',
        loadComponent: () => import('./recipes/recipe-detail/recipe-detail.component').then(m => m.RecipeDetailComponent),
      }
    ]
  },
  {
    path: 'butchery',
    loadComponent: () => import('./pages/butchery/butchery.component').then(m => m.ButcheryComponent),
  },
  {
    path: 'manufacturing',
    loadComponent: () => import('./pages/manufacturing/manufacturing.component').then(m => m.ManufacturingComponent),
  },
];
