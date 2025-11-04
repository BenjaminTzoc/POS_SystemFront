import { Routes } from "@angular/router";
import { PurchasesComponent } from "./purchases.component";
import { SuppliersComponent } from "./suppliers/suppliers.component";
import { SupplierFormComponent } from "./suppliers/supplier-form/supplier-form.component";
import { PurchaseOrdersComponent } from "./purchase-orders/purchase-orders.component";
import { PurchaseOrderFormComponent } from "./purchase-orders/purchase-order-form/purchase-order-form.component";

export const PURCHASES_ROUTES: Routes = [
  {
    path: '',
    component: PurchasesComponent
  },
  {
    path: 'suppliers',
    component: SuppliersComponent
  },
  {
    path: 'new-supplier',
    component: SupplierFormComponent
  },
  {
    path: 'edit-supplier/:id',
    component: SupplierFormComponent
  },
  {
    path: 'orders',
    component: PurchaseOrdersComponent
  },
  {
    path: 'new-order',
    component: PurchaseOrderFormComponent
  }
]