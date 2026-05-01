import { CashEffect, CashMovementKind } from "../../domain/cash/CashMovement.js";

export const cashEffectByKind = {
  PAYMENT_RECEIVED: "IN",
  CHANGE_DELIVERED: "OUT",
  CASH_SUPPLY: "IN",
  CASH_WITHDRAWAL: "OUT",
  OTHER_IN: "IN",
  OTHER_OUT: "OUT",
} as const satisfies Record<CashMovementKind, CashEffect>;

export function getCashEffectForKind(kind: CashMovementKind): CashEffect {
  return cashEffectByKind[kind];
}
