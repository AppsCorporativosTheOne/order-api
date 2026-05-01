import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { StockEntry } from "../../domain/stocks/StockEntry.js";
import {
  CreateStockEntryData,
  ListStockEntriesFilters,
  StockEntryRepository,
} from "../../domain/stocks/StockEntryRepository.js";

type StockEntryRow = {
  id: string;
  product_id: string;
  quantity: string;
  manufacturing_date: Date | null;
  expiration_date: Date | null;
  unit_value: string;
  cost: string;
  final_value: string;
  created_at: Date;
};

export class PostgresStockEntryRepository implements StockEntryRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateStockEntryData): Promise<StockEntry> {
    const result = await this.pool.query<StockEntryRow>(
      `insert into stock_entries (
         id, product_id, quantity, manufacturing_date, expiration_date, unit_value, cost
       )
       values ($1, $2, $3, $4, $5, $6, $7)
       returning
         id, product_id, quantity, manufacturing_date, expiration_date,
         unit_value, cost, final_value, created_at`,
      [
        randomUUID(),
        data.productId,
        data.quantity,
        data.manufacturingDate ?? null,
        data.expirationDate ?? null,
        data.unitValue,
        data.cost,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<StockEntry | null> {
    const result = await this.pool.query<StockEntryRow>(
      `select
         id, product_id, quantity, manufacturing_date, expiration_date,
         unit_value, cost, final_value, created_at
       from stock_entries
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async list(filters: ListStockEntriesFilters): Promise<StockEntry[]> {
    const where: string[] = [];
    const values: Array<string | Date> = [];

    if (filters.productId) {
      values.push(filters.productId);
      where.push(`product_id = $${values.length}`);
    }

    if (filters.expiresUntil) {
      values.push(filters.expiresUntil);
      where.push(`expiration_date <= $${values.length}`);
    }

    const result = await this.pool.query<StockEntryRow>(
      `select
         id, product_id, quantity, manufacturing_date, expiration_date,
         unit_value, cost, final_value, created_at
       from stock_entries
       ${where.length ? `where ${where.join(" and ")}` : ""}
       order by created_at desc`,
      values,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: StockEntryRow): StockEntry {
    return {
      id: row.id,
      productId: row.product_id,
      quantity: Number(row.quantity),
      manufacturingDate: row.manufacturing_date,
      expirationDate: row.expiration_date,
      unitValue: Number(row.unit_value),
      cost: Number(row.cost),
      finalValue: Number(row.final_value),
      createdAt: row.created_at,
    };
  }
}
