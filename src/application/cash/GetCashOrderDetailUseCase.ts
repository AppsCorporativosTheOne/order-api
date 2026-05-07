import { AppError } from "../../domain/errors/AppError.js";
import { CashOrderLineRepository } from "../../domain/cash/CashOrderLineRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class GetCashOrderDetailUseCase {
  constructor(
    private readonly cashOrderRepository: CashOrderRepository,
    private readonly cashOrderLineRepository: CashOrderLineRepository,
  ) {}

  async execute(cashOrderId: string) {
    const order = await this.cashOrderRepository.findById(cashOrderId);

    if (!order) {
      throw new AppError(
        "Pedido/mesa registrado nao encontrado.",
        404,
        "CASH_ORDER_NOT_FOUND",
      );
    }

    const lines = await this.cashOrderLineRepository.listByCashOrderId(cashOrderId);
    const linesTotal = roundMoney(
      await this.cashOrderLineRepository.sumLineTotalByCashOrderId(cashOrderId),
    );

    return { order, lines, linesTotal };
  }
}
