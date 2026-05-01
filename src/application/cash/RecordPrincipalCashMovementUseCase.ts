import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashPrincipalMovementRepository } from "../../domain/cash/CashPrincipalMovementRepository.js";
import { cashPrincipalEffectByKind } from "../../infra/cash/principalKindCashEffect.js";
import { roundMoney } from "../../infra/cash/money.js";

export type ManualPrincipalKind =
  | "PRINCIPAL_SUPPLY"
  | "PRINCIPAL_WITHDRAWAL"
  | "OTHER_IN"
  | "OTHER_OUT";

export class RecordPrincipalCashMovementUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashPrincipalMovementRepository: CashPrincipalMovementRepository,
  ) {}

  async execute(payload: {
    cashDaySessionId: string;
    kind: ManualPrincipalKind;
    amount: number;
    description?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    occurredAt?: Date | null;
  }) {
    const daySession = await this.cashDaySessionRepository.findById(payload.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    if (daySession.status !== "OPEN") {
      throw new AppError(
        "O dia esta encerrado; nao e possivel mover o caixa principal.",
        409,
        "CASH_DAY_CLOSED",
      );
    }

    const amount = roundMoney(payload.amount);

    if (amount <= 0) {
      throw new AppError(
        "Valor deve ser maior que zero.",
        400,
        "INVALID_MOVEMENT_AMOUNT",
      );
    }

    return this.cashPrincipalMovementRepository.create({
      cashDaySessionId: payload.cashDaySessionId,
      kind: payload.kind,
      cashEffect: cashPrincipalEffectByKind[payload.kind],
      amount,
      description: payload.description ?? null,
      referenceType: payload.referenceType ?? null,
      referenceId: payload.referenceId ?? null,
      occurredAt: payload.occurredAt ?? undefined,
    });
  }
}
