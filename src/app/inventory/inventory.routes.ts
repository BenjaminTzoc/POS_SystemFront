import { Routes } from "@angular/router";
import { ProductsComponent } from "./products/products.component";
import { ProductFormComponent } from "./products/product-form/product-form.component";
import { InventoriesComponent } from "./inventories/inventories.component";
import { InventoryFormComponent } from "./inventories/inventory-form/inventory-form.component";
import { ProductCategoriesComponent } from "./product-categories/product-categories.component";
import { CategoryFormComponent } from "./product-categories/category-form/category-form.component";

export const INVENTORY_ROUTES: Routes = [
  {
    path: 'products',
    component: ProductsComponent
  },
  {
    path: 'new-product',
    component: ProductFormComponent
  },
  {
    path: 'inventories',
    component: InventoriesComponent
  },
  {
    path: 'new-inventory',
    component: InventoryFormComponent
  },
  {
    path: 'product-categories',
    component: ProductCategoriesComponent
  },
  {
    path: 'new-category',
    component: CategoryFormComponent
  },
  {
    path: 'edit-category/:id',
    component: CategoryFormComponent
  }
]