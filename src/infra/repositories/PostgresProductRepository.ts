import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
} from "../../domain/products/ProductRepository.js";

type ProductRow = {
  id: string;
  brand: string | null;
  name: string;
  category: string;
  department: string;
  sell_without_stock: Product["sellWithoutStock"];
  created_at: Date;
};

export class PostgresProductRepository implements ProductRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateProductData): Promise<Product> {
    const result = await this.pool.query<ProductRow>(
      `insert into products (id, brand, name, category, department, sell_without_stock)
       values ($1, $2, $3, $4, $5, $6)
       returning id, brand, name, category, department, sell_without_stock, created_at`,
      [
        randomUUID(),
        data.brand ?? null,
        data.name,
        data.category,
        data.department,
        data.sellWithoutStock,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      `select id, brand, name, category, department, sell_without_stock, created_at
       from products
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      `select id, brand, name, category, department, sell_without_stock, created_at
       from products
       where lower(name) = lower($1)
       limit 1`,
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async list(filters: ListProductsFilters): Promise<Product[]> {
    const where: string[] = [];
    const values: string[] = [];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      where.push(`(name ilike $${values.length} or brand ilike $${values.length})`);
    }

    if (filters.category) {
      values.push(filters.category);
      where.push(`category = $${values.length}`);
    }

    if (filters.department) {
      values.push(filters.department);
      where.push(`department = $${values.length}`);
    }

    const result = await this.pool.query<ProductRow>(
      `select id, brand, name, category, department, sell_without_stock, created_at
       from products
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by created_at desc`,
      values,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: ProductRow): Product {
    return {
      id: row.id,
      brand: row.brand,
      name: row.name,
      category: row.category,
      department: row.department,
      sellWithoutStock: row.sell_without_stock,
      createdAt: row.created_at,
    };
  }
}
