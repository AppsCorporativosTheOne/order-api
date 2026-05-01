import { Product } from "./Product.js";

export interface CreateProductData {
  brand?: string | null;
  name: string;
  category: string;
  department: string;
  sellWithoutStock: Product["sellWithoutStock"];
}

export interface ListProductsFilters {
  search?: string;
  category?: string;
  department?: string;
}

export interface ProductRepository {
  create(data: CreateProductData): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  list(filters: ListProductsFilters): Promise<Product[]>;
}
