export type CashPrincipalMovementKind =
  | "OPERATOR_CLOSE_CONTRIBUTION"
  | "PRINCIPAL_SUPPLY"
  | "PRINCIPAL_WITHDRAWAL"
  | "OTHER_IN"
  | "OTHER_OUT";

export interface CashPrincipalMovement {
  id: string;
  cashDaySessionId: string;
  cashOperatorSessionId: string | null;
  kind: CashPrincipalMovementKind;
  amount: number;
  cashEffect: "IN" | "OUT";
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  occurredAt: Date;
  createdAt: Date;
}
