import { Product } from "./Product.js";

export interface CreateProductData {
  brand?: string | null;
  name: string;
  category: string;
  department: string;
  sellWithoutStock: Product["sellWithoutStock"];
  active?: boolean;
  salePrice?: number | null;
}

export interface ListProductsFilters {
  search?: string;
  category?: string;
  department?: string;
  activeOnly?: boolean;
  eligibleForSale?: boolean;
}

export interface UpdateProductData {
  brand?: string | null;
  name?: string;
  category?: string;
  department?: string;
  sellWithoutStock?: Product["sellWithoutStock"];
  active?: boolean;
  salePrice?: number | null;
}

export interface ProductRepository {
  create(data: CreateProductData): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  list(filters: ListProductsFilters): Promise<Product[]>;
  update(id: string, data: UpdateProductData): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}
