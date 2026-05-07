import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
  UpdateProductData,
} from "../../domain/products/ProductRepository.js";

type ProductRow = {
  id: string;
  brand: string | null;
  name: string;
  category: string;
  department: string;
  sell_without_stock: Product["sellWithoutStock"];
  active: boolean;
  sale_price: string | null;
  created_at: Date;
};

export class PostgresProductRepository implements ProductRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateProductData): Promise<Product> {
    const active = data.active ?? true;
    const salePrice = data.salePrice ?? null;

    const result = await this.pool.query<ProductRow>(
      `insert into products (id, brand, name, category, department, sell_without_stock, active, sale_price)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, brand, name, category, department, sell_without_stock, active, sale_price, created_at`,
      [
        randomUUID(),
        data.brand ?? null,
        data.name,
        data.category,
        data.department,
        data.sellWithoutStock,
        active,
        salePrice,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      `select id, brand, name, category, department, sell_without_stock, active, sale_price, created_at
       from products
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByName(name: string): Promise<Product | null> {
    const result = await this.pool.query<ProductRow>(
      `select id, brand, name, category, department, sell_without_stock, active, sale_price, created_at
       from products
       where lower(name) = lower($1)
       limit 1`,
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async list(filters: ListProductsFilters): Promise<Product[]> {
    const stockJoin =
      filters.eligibleForSale === true
        ? `left join (
             select product_id, sum(quantity)::numeric as stock_qty
             from stock_entries
             group by product_id
           ) stock_totals on stock_totals.product_id = p.id`
        : "";

    const where: string[] = [];
    const values: string[] = [];

    if (filters.search) {
      values.push(`%${filters.search}%`);
      where.push(`(p.name ilike $${values.length} or p.brand ilike $${values.length})`);
    }

    if (filters.category) {
      values.push(filters.category);
      where.push(`p.category = $${values.length}`);
    }

    if (filters.department) {
      values.push(filters.department);
      where.push(`p.department = $${values.length}`);
    }

    if (filters.eligibleForSale === true) {
      where.push(`p.active = true`);
      where.push(
        `(p.sell_without_stock = 'YES' or coalesce(stock_totals.stock_qty, 0) > 0)`,
      );
    } else if (filters.activeOnly === true) {
      where.push(`p.active = true`);
    }

    const result = await this.pool.query<ProductRow>(
      `select p.id, p.brand, p.name, p.category, p.department, p.sell_without_stock, p.active, p.sale_price, p.created_at
       from products p
       ${stockJoin}
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by p.created_at desc`,
      values,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async update(id: string, data: UpdateProductData): Promise<Product | null> {
    const sets: string[] = [];
    const values: Array<string | boolean | number | null> = [];

    const push = (column: string, value: string | null) => {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    };

    if (data.brand !== undefined) {
      push("brand", data.brand);
    }

    if (data.name !== undefined) {
      push("name", data.name);
    }

    if (data.category !== undefined) {
      push("category", data.category);
    }

    if (data.department !== undefined) {
      push("department", data.department);
    }

    if (data.sellWithoutStock !== undefined) {
      values.push(data.sellWithoutStock);
      sets.push(`sell_without_stock = $${values.length}`);
    }

    if (data.active !== undefined) {
      values.push(data.active);
      sets.push(`active = $${values.length}`);
    }

    if (data.salePrice !== undefined) {
      values.push(data.salePrice);
      sets.push(`sale_price = $${values.length}`);
    }

    if (!sets.length) {
      return this.findById(id);
    }

    values.push(id);

    const result = await this.pool.query<ProductRow>(
      `update products
       set ${sets.join(", ")}
       where id = $${values.length}
       returning id, brand, name, category, department, sell_without_stock, active, sale_price, created_at`,
      values,
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(`delete from products where id = $1`, [id]);

    return (result.rowCount ?? 0) > 0;
  }

  private toDomain(row: ProductRow): Product {
    return {
      id: row.id,
      brand: row.brand,
      name: row.name,
      category: row.category,
      department: row.department,
      sellWithoutStock: row.sell_without_stock,
      active: row.active,
      salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
      createdAt: row.created_at,
    };
  }
}
