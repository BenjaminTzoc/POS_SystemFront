import { Routes } from "@angular/router";
import { CustomersComponent } from "./customers/customers.component";
import { CustomerFormComponent } from "./customers/customer-form/customer-form.component";

export const SALES_ROUTES: Routes = [
  {
    path: 'customers',
    component: CustomersComponent
  },
  {
    path: 'new-customer',
    component: CustomerFormComponent
  }
]