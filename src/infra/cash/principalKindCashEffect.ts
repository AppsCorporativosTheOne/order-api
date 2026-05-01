import { CashPrincipalMovementKind } from "../../domain/cash/CashPrincipalMovement.js";

export const cashPrincipalEffectByKind = {
  OPERATOR_CLOSE_CONTRIBUTION: "IN",
  PRINCIPAL_SUPPLY: "IN",
  PRINCIPAL_WITHDRAWAL: "OUT",
  OTHER_IN: "IN",
  OTHER_OUT: "OUT",
} as const satisfies Record<CashPrincipalMovementKind, "IN" | "OUT">;
