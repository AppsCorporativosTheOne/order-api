import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { DiningTable } from "../../domain/cash/DiningTable.js";
import {
  CreateDiningTableData,
  DiningTableRepository,
} from "../../domain/cash/DiningTableRepository.js";

type DiningTableRow = {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: Date;
};

export class PostgresDiningTableRepository implements DiningTableRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateDiningTableData): Promise<DiningTable> {
    const result = await this.pool.query<DiningTableRow>(
      `insert into dining_tables (id, name, sort_order)
       values ($1, $2, $3)
       returning id, name, active, sort_order, created_at`,
      [randomUUID(), data.name, data.sortOrder ?? 0],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<DiningTable | null> {
    const result = await this.pool.query<DiningTableRow>(
      `select id, name, active, sort_order, created_at
       from dining_tables
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async list(filters?: { activeOnly?: boolean }): Promise<DiningTable[]> {
    const where = filters?.activeOnly === true ? "where active = true" : "";
    const result = await this.pool.query<DiningTableRow>(
      `select id, name, active, sort_order, created_at
       from dining_tables
       ${where}
       order by sort_order asc, name asc`,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: DiningTableRow): DiningTable {
    return {
      id: row.id,
      name: row.name,
      active: row.active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
    };
  }
}
