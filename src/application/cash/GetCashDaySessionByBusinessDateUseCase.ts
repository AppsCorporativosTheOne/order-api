import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";

export class GetCashDaySessionByBusinessDateUseCase {
  constructor(private readonly cashDaySessionRepository: CashDaySessionRepository) {}

  async execute(businessDate: string) {
    const session =
      await this.cashDaySessionRepository.findByBusinessDate(businessDate);

    if (!session) {
      throw new AppError(
        "Sessao de caixa da data informada nao encontrada.",
        404,
        "CASH_DAY_NOT_FOUND",
      );
    }

    return session;
  }
}
