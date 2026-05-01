import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class OpenCashDaySessionUseCase {
  constructor(private readonly cashDaySessionRepository: CashDaySessionRepository) {}

  async execute(payload: {
    businessDate: string;
    notes?: string | null;
    principalOpeningBalance?: number | null;
  }) {
    const existingForDate =
      await this.cashDaySessionRepository.findByBusinessDate(payload.businessDate);

    if (existingForDate) {
      if (existingForDate.status === "OPEN") {
        throw new AppError(
          "Ja existe um caixa aberto nesta data de negocio.",
          409,
          "CASH_DAY_ALREADY_OPEN",
        );
      }

      throw new AppError(
        "Ja existe sessao registrada nesta data. Nao e possivel reabrir o caixa pela API.",
        409,
        "CASH_DAY_DATE_ALREADY_USED",
      );
    }

    const principalOpeningBalance = payload.principalOpeningBalance ?? 0;

    if (principalOpeningBalance < 0) {
      throw new AppError(
        "Valor inicial do caixa principal nao pode ser negativo.",
        400,
        "INVALID_PRINCIPAL_OPENING_BALANCE",
      );
    }

    return this.cashDaySessionRepository.create({
      businessDate: payload.businessDate,
      notes: payload.notes ?? null,
      principalOpeningBalance: roundMoney(principalOpeningBalance),
    });
  }
}
