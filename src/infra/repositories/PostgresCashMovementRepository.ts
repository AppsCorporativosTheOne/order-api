import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  CashEffect,
  CashMovement,
  CashMovementKind,
} from "../../domain/cash/CashMovement.js";
import {
  CashMovementRepository,
  CashMovementTotals,
  CreateCashMovementData,
} from "../../domain/cash/CashMovementRepository.js";
import { roundMoney } from "../cash/money.js";

type CashMovementRow = {
  id: string;
  cash_operator_session_id: string;
  kind: CashMovementKind;
  amount: string;
  cash_effect: CashEffect;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  occurred_at: Date;
  created_at: Date;
};

function asNumber(pgNumeric: string): number {
  return Number(pgNumeric);
}

export class PostgresCashMovementRepository implements CashMovementRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: CreateCashMovementData): Promise<CashMovement> {
    const occurredAt = data.occurredAt ?? new Date();
    const result = await this.pool.query<CashMovementRow>(
      `insert into cash_movements (
        id,
        cash_operator_session_id,
        kind,
        amount,
        cash_effect,
        description,
        reference_type,
        reference_id,
        occurred_at
      )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz)
       returning
         id,
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
        data.cashOperatorSessionId,
        data.kind,
        data.amount.toFixed(2),
        data.cashEffect,
        data.description ?? null,
        data.referenceType ?? null,
        data.referenceId ?? null,
        occurredAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async listByCashOperatorSessionId(cashOperatorSessionId: string): Promise<CashMovement[]> {
    const result = await this.pool.query<CashMovementRow>(
      `select
         id,
         cash_operator_session_id,
         kind,
         amount::text as amount,
         cash_effect,
         description,
         reference_type,
         reference_id,
         occurred_at,
         created_at
       from cash_movements
       where cash_operator_session_id = $1
       order by occurred_at asc, created_at asc`,
      [cashOperatorSessionId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async sumTotalsForOperatorSession(cashOperatorSessionId: string): Promise<CashMovementTotals> {
    const result = await this.pool.query<{
      payments_in: string | null;
      change_out: string | null;
      cash_supply_in: string | null;
      cash_withdrawal_out: string | null;
      other_in: string | null;
      other_out: string | null;
      net_impact: string | null;
    }>(
      `select
         coalesce(sum(case when kind = 'PAYMENT_RECEIVED' then amount else 0 end), 0)::text payments_in,
         coalesce(sum(case when kind = 'CHANGE_DELIVERED' then amount else 0 end), 0)::text change_out,
         coalesce(sum(case when kind = 'CASH_SUPPLY' then amount else 0 end), 0)::text cash_supply_in,
         coalesce(sum(case when kind = 'CASH_WITHDRAWAL' then amount else 0 end), 0)::text cash_withdrawal_out,
         coalesce(sum(case when kind = 'OTHER_IN' then amount else 0 end), 0)::text other_in,
         coalesce(sum(case when kind = 'OTHER_OUT' then amount else 0 end), 0)::text other_out,
         coalesce(
           sum(case when cash_effect = 'IN' then amount else -amount end),
           0,
         )::text net_impact
       from cash_movements
       where cash_operator_session_id = $1`,
      [cashOperatorSessionId],
    );

    const row = result.rows[0];

    return {
      paymentsIn: roundMoney(asNumber(row.payments_in ?? "0")),
      changeOut: roundMoney(asNumber(row.change_out ?? "0")),
      cashSupplyIn: roundMoney(asNumber(row.cash_supply_in ?? "0")),
      cashWithdrawalOut: roundMoney(asNumber(row.cash_withdrawal_out ?? "0")),
      otherIn: roundMoney(asNumber(row.other_in ?? "0")),
      otherOut: roundMoney(asNumber(row.other_out ?? "0")),
      netImpact: roundMoney(asNumber(row.net_impact ?? "0")),
    };
  }

  private toDomain(row: CashMovementRow): CashMovement {
    return {
      id: row.id,
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
