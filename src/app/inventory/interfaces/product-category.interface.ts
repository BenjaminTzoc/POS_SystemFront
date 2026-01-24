import { Unit } from './product.interface';

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
  defaultUnit: Unit | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateProductCategoryDto {
  name: string;
  description?: string;
  defaultUnitId?: string;
}

export interface UpdateProductCategoryDto {
  name?: string;
  description?: string;
  defaultUnitId?: string;
}
