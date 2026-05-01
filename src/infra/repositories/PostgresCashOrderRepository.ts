import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { CashOrder, CashOrderStatus } from "../../domain/cash/CashOrder.js";
import {
  CashOrderRepository,
  OpenCashOrderData,
} from "../../domain/cash/CashOrderRepository.js";

type CashOrderRow = {
  id: string;
  cash_day_session_id: string;
  cash_operator_session_id: string;
  dining_table_id: string | null;
  status: CashOrderStatus;
  notes: string | null;
  opened_at: Date;
  closed_at: Date | null;
};

export class PostgresCashOrderRepository implements CashOrderRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: OpenCashOrderData): Promise<CashOrder> {
    const result = await this.pool.query<CashOrderRow>(
      `insert into cash_orders (
        id,
        cash_day_session_id,
        cash_operator_session_id,
        dining_table_id,
        status,
        notes
      )
       values ($1, $2, $3, $4, 'OPEN', $5)
       returning
         id,
         cash_day_session_id,
         cash_operator_session_id,
         dining_table_id,
         status,
         notes,
         opened_at,
         closed_at`,
      [
        randomUUID(),
        data.cashDaySessionId,
        data.cashOperatorSessionId,
        data.diningTableId ?? null,
        data.notes ?? null,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<CashOrder | null> {
    const result = await this.pool.query<CashOrderRow>(
      `select
         id,
         cash_day_session_id,
         cash_operator_session_id,
         dining_table_id,
         status,
         notes,
         opened_at,
         closed_at
       from cash_orders
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async listByCashDaySessionId(cashDaySessionId: string): Promise<CashOrder[]> {
    const result = await this.pool.query<CashOrderRow>(
      `select
         id,
         cash_day_session_id,
         cash_operator_session_id,
         dining_table_id,
         status,
         notes,
         opened_at,
         closed_at
       from cash_orders
       where cash_day_session_id = $1
       order by opened_at desc`,
      [cashDaySessionId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async countOpenByCashOperatorSessionId(cashOperatorSessionId: string): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      `select count(*)::text as count
       from cash_orders
       where cash_operator_session_id = $1 and status = 'OPEN'`,
      [cashOperatorSessionId],
    );

    return Number(result.rows[0].count ?? "0");
  }

  async close(orderId: string): Promise<CashOrder> {
    const result = await this.pool.query<CashOrderRow>(
      `update cash_orders
       set status = 'CLOSED', closed_at = now()
       where id = $1 and status = 'OPEN'
       returning
         id,
         cash_day_session_id,
         cash_operator_session_id,
         dining_table_id,
         status,
         notes,
         opened_at,
         closed_at`,
      [orderId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Nao foi possivel encerrar o pedido.");
    }

    return this.toDomain(row);
  }

  private toDomain(row: CashOrderRow): CashOrder {
    return {
      id: row.id,
      cashDaySessionId: row.cash_day_session_id,
      cashOperatorSessionId: row.cash_operator_session_id,
      diningTableId: row.dining_table_id,
      status: row.status,
      notes: row.notes,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
    };
  }
}
