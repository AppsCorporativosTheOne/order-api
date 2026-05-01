export type CashMovementKind =
  | "PAYMENT_RECEIVED"
  | "CHANGE_DELIVERED"
  | "CASH_SUPPLY"
  | "CASH_WITHDRAWAL"
  | "OTHER_IN"
  | "OTHER_OUT";

export type CashEffect = "IN" | "OUT";

export interface CashMovement {
  id: string;
  cashOperatorSessionId: string;
  kind: CashMovementKind;
  amount: number;
  cashEffect: CashEffect;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  occurredAt: Date;
  createdAt: Date;
}
