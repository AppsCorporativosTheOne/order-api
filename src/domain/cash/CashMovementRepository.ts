import { CashEffect, CashMovement, CashMovementKind } from "./CashMovement.js";

export type CreateCashMovementData = {
  cashOperatorSessionId: string;
  kind: CashMovementKind;
  cashEffect: CashEffect;
  amount: number;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  occurredAt?: Date;
};

export type CashMovementTotals = {
  paymentsIn: number;
  changeOut: number;
  cashSupplyIn: number;
  cashWithdrawalOut: number;
  otherIn: number;
  otherOut: number;
  netImpact: number;
};

export interface CashMovementRepository {
  create(data: CreateCashMovementData): Promise<CashMovement>;
  listByCashOperatorSessionId(cashOperatorSessionId: string): Promise<CashMovement[]>;
  sumTotalsForOperatorSession(cashOperatorSessionId: string): Promise<CashMovementTotals>;
}
