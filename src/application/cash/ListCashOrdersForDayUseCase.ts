import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";

export class ListCashOrdersForDayUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOrderRepository: CashOrderRepository,
  ) {}

  async execute(cashDaySessionId: string) {
    const daySession =
      await this.cashDaySessionRepository.findById(cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    return this.cashOrderRepository.listByCashDaySessionId(cashDaySessionId);
  }
}
