import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { CashDbClient } from "../../domain/cash/CashDbClient.js";
import {
  CashPrincipalMovement,
  CashPrincipalMovementKind,
} from "../../domain/cash/CashPrincipalMovement.js";
import {
  CashPrincipalMovementRepository,
  CashPrincipalMovementTotals,
  CreateCashPrincipalMovementData,
} from "../../domain/cash/CashPrincipalMovementRepository.js";
import { roundMoney } from "../cash/money.js";

type CashPrincipalMovementRow = {
  id: string;
  cash_day_session_id: string;
  cash_operator_session_id: string | null;
  kind: CashPrincipalMovementKind;
  amount: string;
  cash_effect: "IN" | "OUT";
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  occurred_at: Date;
  created_at: Date;
};

function asNumber(pgNumeric: string): number {
  return Number(pgNumeric);
}

export class PostgresCashPrincipalMovementRepository implements CashPrincipalMovementRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateCashPrincipalMovementData): Promise<CashPrincipalMovement> {
    return this.createWithClient(
      {
        query: async (text, vals) => ({
          rows: (await this.pool.query(text, vals as unknown[])).rows as unknown[],
        }),
      },
      data,
    );
  }

  async createWithClient(
    client: CashDbClient,
    data: CreateCashPrincipalMovementData,
  ): Promise<CashPrincipalMovement> {
    const occurredAt = data.occurredAt ?? new Date();
    const result = await client.query(
      `insert into cash_principal_movements (
        id,
        cash_day_session_id,
        cash_operator_session_id,
        kind,
        amount,
        cash_effect,
        description,
        reference_type,
        reference_id,
        occurred_at
      )
       values ($1, $2, $3, $4, $5::numeric, $6, $7, $8, $9, $10::timestamptz)
       returning
         id,
         cash_day_session_id,
         cash_operator_session_id,
         kind,
         amount::text as amount,
         cash_effect,
         description,
         reference_type,
         reference_id,
         occurred_at,
         created_at`,
      [
        randomUUID(),
        data.cashDaySessionId,
        data.cashOperatorSessionId ?? null,
        data.kind,
        data.amount.toFixed(2),
        data.cashEffect,
        data.description ?? null,
        data.referenceType ?? null,
        data.referenceId ?? null,
        occurredAt,
      ],
    );

    const row = result.rows[0] as CashPrincipalMovementRow | undefined;

    if (!row) {
      throw new Error("Nao foi possivel registrar lancamento do caixa principal.");
    }

    return this.toDomain(row);
  }

  async listByCashDaySessionId(cashDaySessionId: string): Promise<CashPrincipalMovement[]> {
    const result = await this.pool.query<CashPrincipalMovementRow>(
      `select
         id,
         cash_day_session_id,
         cash_operator_session_id,
         kind,
         amount::text as amount,
         cash_effect,
         description,
         reference_type,
         reference_id,
         occurred_at,
         created_at
       from cash_principal_movements
       where cash_day_session_id = $1
       order by occurred_at asc, created_at asc`,
      [cashDaySessionId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async sumTotalsForDay(cashDaySessionId: string): Promise<CashPrincipalMovementTotals> {
    const result = await this.pool.query<{
      operator_close_in: string | null;
      supply_in: string | null;
      withdrawal_out: string | null;
      other_in: string | null;
      other_out: string | null;
      net_impact: string | null;
    }>(
      `select
         coalesce(
           sum(
             case
               when kind = 'OPERATOR_CLOSE_CONTRIBUTION' then amount else 0 end
           ),
           0,
         )::text operator_close_in,
         coalesce(sum(case when kind = 'PRINCIPAL_SUPPLY' then amount else 0 end), 0)::text supply_in,
         coalesce(
           sum(case when kind = 'PRINCIPAL_WITHDRAWAL' then amount else 0 end),
           0,
         )::text withdrawal_out,
         coalesce(sum(case when kind = 'OTHER_IN' then amount else 0 end), 0)::text other_in,
         coalesce(sum(case when kind = 'OTHER_OUT' then amount else 0 end), 0)::text other_out,
         coalesce(
           sum(case when cash_effect = 'IN' then amount else -amount end),
           0,
         )::text net_impact
       from cash_principal_movements
       where cash_day_session_id = $1`,
      [cashDaySessionId],
    );

    const row = result.rows[0];

    return {
      operatorContributionIn: roundMoney(asNumber(row.operator_close_in ?? "0")),
      principalSupplyIn: roundMoney(asNumber(row.supply_in ?? "0")),
      principalWithdrawalOut: roundMoney(asNumber(row.withdrawal_out ?? "0")),
      otherIn: roundMoney(asNumber(row.other_in ?? "0")),
      otherOut: roundMoney(asNumber(row.other_out ?? "0")),
      netImpact: roundMoney(asNumber(row.net_impact ?? "0")),
    };
  }

  private toDomain(row: CashPrincipalMovementRow): CashPrincipalMovement {
    return {
      id: row.id,
      cashDaySessionId: row.cash_day_session_id,
      cashOperatorSessionId: row.cash_operator_session_id,
      kind: row.kind,
      amount: roundMoney(asNumber(row.amount)),
      cashEffect: row.cash_effect,
      description: row.description,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    };
  }
}
