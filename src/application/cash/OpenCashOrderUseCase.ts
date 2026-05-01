import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOperatorSessionRepository } from "../../domain/cash/CashOperatorSessionRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { DiningTableRepository } from "../../domain/cash/DiningTableRepository.js";

export class OpenCashOrderUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOperatorSessionRepository: CashOperatorSessionRepository,
    private readonly cashOrderRepository: CashOrderRepository,
    private readonly diningTableRepository: DiningTableRepository,
  ) {}

  async execute(payload: {
    cashOperatorSessionId: string;
    diningTableId?: string | null;
    notes?: string | null;
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
        "Operador precisa estar com caixa em aberto para registrar pedidos/mesas.",
        409,
        "CASH_OPERATOR_SESSION_CLOSED",
      );
    }

    const daySession = await this.cashDaySessionRepository.findById(drawer.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Contexto principal do dia nao encontrado para este operador.",
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

    if (payload.diningTableId) {
      const table = await this.diningTableRepository.findById(payload.diningTableId);

      if (!table) {
        throw new AppError("Mesa informada nao encontrada.", 404, "DINING_TABLE_NOT_FOUND");
      }

      if (!table.active) {
        throw new AppError("Mesa inativa.", 409, "DINING_TABLE_INACTIVE");
      }
    }

    return this.cashOrderRepository.create({
      cashDaySessionId: drawer.cashDaySessionId,
      cashOperatorSessionId: drawer.id,
      diningTableId: payload.diningTableId ?? null,
      notes: payload.notes ?? null,
    });
  }
}
