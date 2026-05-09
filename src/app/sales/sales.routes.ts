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
    path: 'customer-categories',
    loadComponent: () => import('./customer-categories/customer-categories.component').then(m => m.CustomerCategoriesComponent),
  },
  {
    path: 'customer-categories/new',
    loadComponent: () => import('./customer-categories/customer-category-form/customer-category-form.component').then(m => m.CustomerCategoryFormComponent),
  },
  {
    path: 'customer-categories/edit/:id',
    loadComponent: () => import('./customer-categories/customer-category-form/customer-category-form.component').then(m => m.CustomerCategoryFormComponent),
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
  {
    path: 'quotations',
    loadComponent: () =>
      import('./quotations/quotations.component').then((m) => m.QuotationsComponent),
  },
  {
    path: 'new-quotation',
    loadComponent: () =>
      import('./quotations/quotation-form/quotation-form.component').then(
        (m) => m.QuotationFormComponent,
      ),
  },
  {
    path: 'quick-sale',
    loadComponent: () =>
      import('./quick-sales/quick-sales.component').then(
        (m) => m.QuickSaleComponent,
      ),
  },
  {
    path: 'payment-methods',
    loadComponent: () => import('./payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
  },
  {
    path: 'payment-methods/new',
    loadComponent: () => import('./payment-methods/payment-method-form/payment-method-form.component').then(m => m.PaymentMethodFormComponent),
  },
  {
    path: 'payment-methods/edit/:id',
    loadComponent: () => import('./payment-methods/payment-method-form/payment-method-form.component').then(m => m.PaymentMethodFormComponent),
  },
];
