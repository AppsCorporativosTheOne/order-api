import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { CashOrderLine } from "../../domain/cash/CashOrderLine.js";
import {
  CashOrderLineRepository,
  CreateCashOrderLineData,
} from "../../domain/cash/CashOrderLineRepository.js";

type CashOrderLineRow = {
  id: string;
  cash_order_id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  notes: string | null;
  created_at: Date;
};

export class PostgresCashOrderLineRepository implements CashOrderLineRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateCashOrderLineData): Promise<CashOrderLine> {
    const result = await this.pool.query<CashOrderLineRow>(
      `insert into cash_order_lines (
         id, cash_order_id, product_id, quantity, unit_price, notes
       )
       values ($1, $2, $3, $4, $5, $6)
       returning
         id, cash_order_id, product_id, quantity, unit_price, line_total, notes, created_at`,
      [
        randomUUID(),
        data.cashOrderId,
        data.productId,
        data.quantity,
        data.unitPrice,
        data.notes ?? null,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async listByCashOrderId(cashOrderId: string): Promise<CashOrderLine[]> {
    const result = await this.pool.query<CashOrderLineRow>(
      `select id, cash_order_id, product_id, quantity, unit_price, line_total, notes, created_at
       from cash_order_lines
       where cash_order_id = $1
       order by created_at asc`,
      [cashOrderId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async sumLineTotalByCashOrderId(cashOrderId: string): Promise<number> {
    const result = await this.pool.query<{ sum: string }>(
      `select coalesce(sum(line_total), 0)::text as sum
       from cash_order_lines
       where cash_order_id = $1`,
      [cashOrderId],
    );

    return Number(result.rows[0]?.sum ?? "0");
  }

  private toDomain(row: CashOrderLineRow): CashOrderLine {
    return {
      id: row.id,
      cashOrderId: row.cash_order_id,
      productId: row.product_id,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.line_total),
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
