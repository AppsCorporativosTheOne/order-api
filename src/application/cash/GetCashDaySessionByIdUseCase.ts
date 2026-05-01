import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";

export class GetCashDaySessionByIdUseCase {
  constructor(private readonly cashDaySessionRepository: CashDaySessionRepository) {}

  async execute(cashDaySessionId: string) {
    const session = await this.cashDaySessionRepository.findById(cashDaySessionId);

    if (!session) {
      throw new AppError(
        "Sessao diaria do caixa nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    return session;
  }
}
