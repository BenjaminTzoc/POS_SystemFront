import { Product } from "../../inventory/interfaces/product.interface";

export interface IRecipeIngredient {
  id: string;
  productId: string;
  componentId: string;
  component?: Product;
  quantity: number;
  notes?: string;
}

export interface ICreateRecipeIngredient {
  productId: string;
  componentId: string;
  quantity: number;
  notes?: string;
}

export interface IRecipeResponse {
  productId: string;
  product?: Product;
  ingredients: IRecipeIngredient[];
}
