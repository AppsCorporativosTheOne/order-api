import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { CashDbClient } from "../../domain/cash/CashDbClient.js";
import {
  CashOperatorSession,
  CashOperatorSessionStatus,
} from "../../domain/cash/CashOperatorSession.js";
import {
  CashOperatorSessionRepository,
  CloseCashOperatorSessionValues,
  OpenCashOperatorSessionData,
} from "../../domain/cash/CashOperatorSessionRepository.js";
import { roundMoney } from "../cash/money.js";

type CashOperatorRow = {
  id: string;
  cash_day_session_id: string;
  operator_id: string;
  opening_balance: string;
  status: CashOperatorSessionStatus;
  notes: string | null;
  opened_at: Date;
  closed_at: Date | null;
  expected_cash_balance: string | null;
  counted_cash_balance: string | null;
  cash_difference: string | null;
};

export class PostgresCashOperatorSessionRepository implements CashOperatorSessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: OpenCashOperatorSessionData): Promise<CashOperatorSession> {
    const result = await this.pool.query<CashOperatorRow>(
      `insert into cash_operator_sessions (
        id,
        cash_day_session_id,
        operator_id,
        opening_balance,
        status,
        notes
      )
       values ($1, $2, $3, $4::numeric, 'OPEN', $5)
       returning
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference`,
      [
        randomUUID(),
        data.cashDaySessionId,
        data.operatorId,
        data.openingBalance.toFixed(2),
        data.notes ?? null,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findById(id: string): Promise<CashOperatorSession | null> {
    const result = await this.pool.query<CashOperatorRow>(
      `select
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference
       from cash_operator_sessions
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findAnyOpenSessionForOperator(operatorId: string): Promise<CashOperatorSession | null> {
    const result = await this.pool.query<CashOperatorRow>(
      `select
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference
       from cash_operator_sessions
       where operator_id = $1 and status = 'OPEN'
       limit 1`,
      [operatorId],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findByCashDaySessionAndOperatorId(
    cashDaySessionId: string,
    operatorId: string,
  ): Promise<CashOperatorSession | null> {
    const result = await this.pool.query<CashOperatorRow>(
      `select
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference
       from cash_operator_sessions
       where cash_day_session_id = $1 and operator_id = $2
       limit 1`,
      [cashDaySessionId, operatorId],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async listByCashDaySessionId(cashDaySessionId: string): Promise<CashOperatorSession[]> {
    const result = await this.pool.query<CashOperatorRow>(
      `select
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference
       from cash_operator_sessions
       where cash_day_session_id = $1
       order by opened_at asc`,
      [cashDaySessionId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async hasOpenSessionsForCashDay(cashDaySessionId: string): Promise<boolean> {
    const result = await this.pool.query<{ count: string }>(
      `select count(*)::text as count
       from cash_operator_sessions
       where cash_day_session_id = $1 and status = 'OPEN'`,
      [cashDaySessionId],
    );

    return Number(result.rows[0].count ?? "0") > 0;
  }

  async closeSession(
    sessionId: string,
    values: CloseCashOperatorSessionValues,
  ): Promise<CashOperatorSession> {
    const client: CashDbClient = {
      query: async (text, vals) =>
        ({
          rows: (await this.pool.query(text, vals as unknown[])).rows as unknown[],
        }) as { rows: unknown[] },
    };

    return this.closeSessionWithClient(client, sessionId, values);
  }

  async closeSessionWithClient(
    client: CashDbClient,
    sessionId: string,
    values: CloseCashOperatorSessionValues,
  ): Promise<CashOperatorSession> {
    const result = await client.query(
      `update cash_operator_sessions
       set
         status = 'CLOSED',
         closed_at = now(),
         expected_cash_balance = $2::numeric,
         counted_cash_balance = $3::numeric,
         cash_difference = $4::numeric,
         notes = coalesce($5, notes)
       where id = $1 and status = 'OPEN'
       returning
         id,
         cash_day_session_id,
         operator_id,
         opening_balance::text as opening_balance,
         status,
         notes,
         opened_at,
         closed_at,
         expected_cash_balance::text as expected_cash_balance,
         counted_cash_balance::text as counted_cash_balance,
         cash_difference::text as cash_difference`,
      [
        sessionId,
        values.expectedCashBalance.toFixed(2),
        values.countedCashBalance.toFixed(2),
        values.cashDifference.toFixed(2),
        values.notes ?? null,
      ],
    );

    const row = result.rows[0] as CashOperatorRow | undefined;

    if (!row) {
      throw new Error("Nao foi possivel encerrar a sessao de caixa do operador.");
    }

    return this.toDomain(row);
  }

  private toDomain(row: CashOperatorRow): CashOperatorSession {
    return {
      id: row.id,
      cashDaySessionId: row.cash_day_session_id,
      operatorId: row.operator_id,
      openingBalance: roundMoney(Number(row.opening_balance)),
      status: row.status,
      notes: row.notes,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      expectedCashBalance:
        row.expected_cash_balance === null ? null : roundMoney(Number(row.expected_cash_balance)),
      countedCashBalance:
        row.counted_cash_balance === null ? null : roundMoney(Number(row.counted_cash_balance)),
      cashDifference:
        row.cash_difference === null ? null : roundMoney(Number(row.cash_difference)),
    };
  }
}
