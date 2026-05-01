import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";

export class CloseCashOrderUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOrderRepository: CashOrderRepository,
  ) {}

  async execute(orderId: string) {
    const order = await this.cashOrderRepository.findById(orderId);

    if (!order) {
      throw new AppError(
        "Pedido/mesa registrado nao encontrado.",
        404,
        "CASH_ORDER_NOT_FOUND",
      );
    }

    if (order.status !== "OPEN") {
      throw new AppError(
        "Este pedido/mesa ja foi encerrado.",
        409,
        "CASH_ORDER_ALREADY_CLOSED",
      );
    }

    const daySession = await this.cashDaySessionRepository.findById(order.cashDaySessionId);

    if (!daySession) {
      throw new AppError(
        "Caixa principal vinculado ao pedido nao foi encontrado.",
        500,
        "CASH_DAY_INCONSISTENT",
      );
    }

    if (daySession.status !== "OPEN") {
      throw new AppError(
        "Caixa principal do dia esta encerrado.",
        409,
        "CASH_DAY_CLOSED",
      );
    }

    try {
      return await this.cashOrderRepository.close(orderId);
    } catch {
      throw new AppError(
        "Nao foi possivel atualizar este pedido/mesa.",
        409,
        "CASH_ORDER_CLOSE_REJECTED",
      );
    }
  }
}
