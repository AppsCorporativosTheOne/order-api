import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  CashDaySession,
  CashDaySessionStatus,
} from "../../domain/cash/CashDaySession.js";
import {
  CashDaySessionRepository,
  FinalizeCashDayCloseData,
  OpenCashDaySessionData,
} from "../../domain/cash/CashDaySessionRepository.js";
import { roundMoney } from "../cash/money.js";

type CashDayRow = {
  id: string;
  business_date: Date | string;
  status: CashDaySessionStatus;
  notes: string | null;
  opened_at: Date;
  closed_at: Date | null;
  principal_opening_balance: string;
  principal_expected_cash_balance: string | null;
  principal_counted_cash_balance: string | null;
  principal_cash_difference: string | null;
  principal_close_notes: string | null;
};

const cashDayReturningColumns = `
  id,
  business_date,
  status,
  notes,
  opened_at,
  closed_at,
  principal_opening_balance::text as principal_opening_balance,
  principal_expected_cash_balance::text as principal_expected_cash_balance,
  principal_counted_cash_balance::text as principal_counted_cash_balance,
  principal_cash_difference::text as principal_cash_difference,
  principal_close_notes`;

export class PostgresCashDaySessionRepository implements CashDaySessionRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: OpenCashDaySessionData): Promise<CashDaySession> {
    const principalOpeningBalance = roundMoney(data.principalOpeningBalance ?? 0);

    const result = await this.pool.query<CashDayRow>(
      `insert into cash_day_sessions (id, business_date, status, notes, principal_opening_balance)
       values ($1, $2::date, 'OPEN', $3, $4::numeric)
       returning ${cashDayReturningColumns}`,
      [
        randomUUID(),
        data.businessDate,
        data.notes ?? null,
        principalOpeningBalance.toFixed(2),
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByBusinessDate(businessDate: string): Promise<CashDaySession | null> {
    const result = await this.pool.query<CashDayRow>(
      `select ${cashDayReturningColumns}
       from cash_day_sessions
       where business_date = $1::date
       limit 1`,
      [businessDate],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async findById(id: string): Promise<CashDaySession | null> {
    const result = await this.pool.query<CashDayRow>(
      `select ${cashDayReturningColumns}
       from cash_day_sessions
       where id = $1`,
      [id],
    );

    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }

  async updateStatus(
    sessionId: string,
    status: CashDaySessionStatus,
    closedAt?: Date | null,
  ): Promise<void> {
    await this.pool.query(
      `update cash_day_sessions
       set status = $2::text, closed_at = $3::timestamptz
       where id = $1`,
      [sessionId, status, status === "CLOSED" ? closedAt ?? new Date() : null],
    );
  }

  async finalizeDayClose(sessionId: string, data: FinalizeCashDayCloseData): Promise<void> {
    const result = await this.pool.query(
      `update cash_day_sessions
       set
         status = 'CLOSED',
         closed_at = $2::timestamptz,
         principal_expected_cash_balance = $3::numeric,
         principal_counted_cash_balance = $4::numeric,
         principal_cash_difference = $5::numeric,
         principal_close_notes = coalesce($6, principal_close_notes)
       where id = $1 and status = 'OPEN'`,
      [
        sessionId,
        data.closedAt,
        data.principalExpectedCashBalance.toFixed(2),
        data.principalCountedCashBalance.toFixed(2),
        data.principalCashDifference.toFixed(2),
        data.principalCloseNotes ?? null,
      ],
    );

    if (Number(result.rowCount ?? 0) === 0) {
      throw new Error("Nao foi possivel finalizar o encerramento do caixa principal.");
    }
  }

  private normalizeBusinessDate(value: CashDayRow["business_date"]): string {
    if (typeof value === "string") {
      return value.slice(0, 10);
    }

    return value.toISOString().slice(0, 10);
  }

  private toDomain(row: CashDayRow): CashDaySession {
    return {
      id: row.id,
      businessDate: this.normalizeBusinessDate(row.business_date),
      status: row.status,
      notes: row.notes,
      openedAt: row.opened_at,
      closedAt: row.closed_at,
      principalOpeningBalance: roundMoney(Number(row.principal_opening_balance)),
      principalExpectedCashBalance:
        row.principal_expected_cash_balance === null
          ? null
          : roundMoney(Number(row.principal_expected_cash_balance)),
      principalCountedCashBalance:
        row.principal_counted_cash_balance === null
          ? null
          : roundMoney(Number(row.principal_counted_cash_balance)),
      principalCashDifference:
        row.principal_cash_difference === null
          ? null
          : roundMoney(Number(row.principal_cash_difference)),
      principalCloseNotes: row.principal_close_notes,
    };
  }
}
