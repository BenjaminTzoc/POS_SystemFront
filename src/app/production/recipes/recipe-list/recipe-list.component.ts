import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Ripple } from 'primeng/ripple';

import { ProductsService } from '../../../inventory/services/products.service';
import { Product, ProductType } from '../../../inventory/interfaces/product.interface';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    Ripple
  ],
  templateUrl: './recipe-list.component.html'
})
export class RecipeListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  loading = signal<boolean>(false);
  expandedRows: { [key: string]: boolean } = {};

  onExpandedRowKeysChange(event: { [key: string]: boolean }) {
    this.expandedRows = event;
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    // Excluimos componentes, materias primas e insumos, y también maestros (familias) 
    // directamente desde el endpoint usando isMaster=false
    // Quitamos el filtro de isMaster=false para traer también los maestros
    // El filtro de tipos para excluir componentes si lo quitamos ya que las recetas pueden ser para componentes también
    // Pero dejamos la exclusión de insumos y materias primas según lo solicitado
    this.productsService.getProducts(undefined, false, undefined, undefined, undefined, 'raw_material,insumo').subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          // Filtramos para mostrar solo productos maestros o normales (no variantes)
          // Las variantes se verán dentro de los maestros
          this.products.set(res.data.filter((p: Product) => !p.isVariant));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  manageRecipe(productId: string): void {
    this.router.navigate(['/production/recipes/detail', productId]);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case ProductType.FINISHED_PRODUCT: return 'Terminado';
      case ProductType.RAW_MATERIAL: return 'Materia Prima';
      case ProductType.INSUMO: return 'Insumo';
      case ProductType.COMPONENT: return 'Componente';
      default: return type;
    }
  }

  getTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (type) {
      case ProductType.FINISHED_PRODUCT: return 'success';
      case ProductType.RAW_MATERIAL: return 'contrast';
      case ProductType.INSUMO: return 'info';
      case ProductType.COMPONENT: return 'warn';
      default: return 'secondary';
    }
  }
}
