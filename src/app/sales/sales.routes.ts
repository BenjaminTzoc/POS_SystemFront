import { Routes } from '@angular/router';
import { CustomersComponent } from './customers/customers.component';
import { CustomerFormComponent } from './customers/customer-form/customer-form.component';
import { SaleOrdersComponent } from './sale-orders/sale-orders.component';
import { SaleOrderFormComponent } from './sale-orders/sale-order-form/sale-order-form.component';

export const SALES_ROUTES: Routes = [
  {
    path: 'customers',
    component: CustomersComponent,
  },
  {
    path: 'new-customer',
    component: CustomerFormComponent,
  },
  {
    path: 'edit-customer/:id',
    component: CustomerFormComponent,
  },
  {
    path: 'orders',
    component: SaleOrdersComponent,
  },
  {
    path: 'new-order',
    component: SaleOrderFormComponent,
  },
  {
    path: 'cash-register',
    loadComponent: () =>
      import('./cash-register/cash-register.component').then((m) => m.CashRegisterComponent),
  },
  {
    path: 'cash-history',
    loadComponent: () =>
      import('./cash-register/cash-history/cash-history.component').then(
        (m) => m.CashHistoryComponent,
      ),
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./pos/pos-layout/pos-layout.component').then((m) => m.PosLayoutComponent),
  },
];
