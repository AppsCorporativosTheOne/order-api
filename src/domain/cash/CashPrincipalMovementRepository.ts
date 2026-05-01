import type { CashDbClient } from "./CashDbClient.js";
import { CashPrincipalMovement, CashPrincipalMovementKind } from "./CashPrincipalMovement.js";

export type CreateCashPrincipalMovementData = {
  cashDaySessionId: string;
  cashOperatorSessionId?: string | null;
  kind: CashPrincipalMovementKind;
  cashEffect: "IN" | "OUT";
  amount: number;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  occurredAt?: Date;
};

export type CashPrincipalMovementTotals = {
  operatorContributionIn: number;
  principalSupplyIn: number;
  principalWithdrawalOut: number;
  otherIn: number;
  otherOut: number;
  netImpact: number;
};

export interface CashPrincipalMovementRepository {
  create(data: CreateCashPrincipalMovementData): Promise<CashPrincipalMovement>;
  createWithClient(
    client: CashDbClient,
    data: CreateCashPrincipalMovementData,
  ): Promise<CashPrincipalMovement>;
  listByCashDaySessionId(cashDaySessionId: string): Promise<CashPrincipalMovement[]>;
  sumTotalsForDay(cashDaySessionId: string): Promise<CashPrincipalMovementTotals>;
}
