import { AppError } from "../../domain/errors/AppError.js";
import { CashMovementKind } from "../../domain/cash/CashMovement.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashMovementRepository } from "../../domain/cash/CashMovementRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { getCashEffectForKind } from "../../infra/cash/cashKindCashEffect.js";
import { roundMoney } from "../../infra/cash/money.js";

export class RecordCashMovementUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashMovementRepository: CashMovementRepository,
  ) {}

  async execute(payload: {
    cashOperatorSessionId: string;
    kind: CashMovementKind;
    amount: number;
    description?: string | null;
    referenceType?: string | null;
    referenceId?: string | null;
    occurredAt?: Date | null;
  }) {
    const drawer =
      await this.cashOperatorSessionRepository.findById(payload.cashOperatorSessionId);

    if (!drawer) {
      throw new AppError(
        "Sessao de caixa do operador nao encontrada.",
        404,
        "CASH_OPERATOR_SESSION_NOT_FOUND",
      );
    }

    if (drawer.status !== "OPEN") {
      throw new AppError(
        "Nao e possivel lancar movimentos em caixa ja encerrado.",
        409,
        "CASH_OPERATOR_SESSION_ALREADY_CLOSED",
      );
    }

    const daySession = await this.cashDaySessionRepository.findById(drawer.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa estava inconsistente na base.",
        500,
        "CASH_DAY_INCONSISTENT",
      );
    }

    if (daySession.status !== "OPEN") {
      throw new AppError(
        "O dia de caixa esta encerrado.",
        409,
        "CASH_DAY_CLOSED",
      );
    }

    const amount = roundMoney(payload.amount);

    if (amount <= 0) {
      throw new AppError("Valor deve ser maior que zero.", 400, "INVALID_MOVEMENT_AMOUNT");
    }

    return this.cashMovementRepository.create({
      cashOperatorSessionId: drawer.id,
      kind: payload.kind,
      cashEffect: getCashEffectForKind(payload.kind),
      amount,
      description: payload.description ?? null,
      referenceType: payload.referenceType ?? null,
      referenceId: payload.referenceId ?? null,
      occurredAt: payload.occurredAt ?? undefined,
    });
  }
}
