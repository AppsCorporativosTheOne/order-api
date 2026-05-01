import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Operator } from "../../domain/operators/Operator.js";
import {
  CreateOperatorData,
  OperatorRepository,
} from "../../domain/operators/OperatorRepository.js";

type OperatorRow = {
  id: string;
  name: string;
  code: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
};

export class PostgresOperatorRepository implements OperatorRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateOperatorData): Promise<Operator> {
    const result = await this.pool.query<OperatorRow>(
      `insert into operators (id, name, code)
       values ($1, $2, $3)
       returning id, name, code, active, created_at, updated_at`,
      [randomUUID(), data.name, data.code ?? null],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<Operator | null> {
    const result = await this.pool.query<OperatorRow>(
      `select id, name, code, active, created_at, updated_at
       from operators
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByNameIgnoringCase(name: string): Promise<Operator | null> {
    const result = await this.pool.query<OperatorRow>(
      `select id, name, code, active, created_at, updated_at
       from operators
       where lower(name) = lower($1)
       limit 1`,
      [name],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async list(filters: { activeOnly?: boolean }): Promise<Operator[]> {
    const where = filters.activeOnly === true ? "where active = true" : "";
    const result = await this.pool.query<OperatorRow>(
      `select id, name, code, active, created_at, updated_at
       from operators
       ${where}
       order by name asc`,
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: OperatorRow): Operator {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
