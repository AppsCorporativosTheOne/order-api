import { AppError } from "../../domain/errors/AppError.js";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOrderLineRepository } from "../../domain/cash/CashOrderLineRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";
import { StockEntryRepository } from "../../domain/stocks/StockEntryRepository.js";
import { roundMoney } from "../../infra/cash/money.js";

export class AddCashOrderLineUseCase {
  constructor(
    private readonly cashDaySessionRepository: CashDaySessionRepository,
    private readonly cashOrderRepository: CashOrderRepository,
    private readonly cashOrderLineRepository: CashOrderLineRepository,
    private readonly productRepository: ProductRepository,
    private readonly stockEntryRepository: StockEntryRepository,
  ) {}

  async execute(
    cashOrderId: string,
    payload: {
      productId: string;
      quantity: number;
      unitPrice?: number;
      notes?: string | null;
    },
  ) {
    const order = await this.cashOrderRepository.findById(cashOrderId);

    if (!order) {
      throw new AppError(
        "Pedido/mesa registrado nao encontrado.",
        404,
        "CASH_ORDER_NOT_FOUND",
      );
    }

    if (order.status !== "OPEN") {
      throw new AppError(
        "Nao e possivel acrescentar itens a um pedido ja encerrado.",
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

    const product = await this.productRepository.findById(payload.productId);

    if (!product) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    if (!product.active) {
      throw new AppError(
        "Produto inativo nao pode ser adicionado ao pedido.",
        409,
        "PRODUCT_INACTIVE_FOR_ORDER",
      );
    }

    const stockQty = await this.stockEntryRepository.sumQuantityByProductId(product.id);
    const allowedWithoutStock = product.sellWithoutStock === "YES";

    if (!allowedWithoutStock && stockQty <= 0) {
      throw new AppError(
        "Produto sem estoque disponivel para venda.",
        409,
        "PRODUCT_OUT_OF_STOCK",
      );
    }

    const resolvedUnit =
      payload.unitPrice !== undefined ? payload.unitPrice : product.salePrice;

    if (resolvedUnit === undefined || resolvedUnit === null) {
      throw new AppError(
        "Informe unitPrice ou cadastre salePrice no produto.",
        400,
        "MISSING_UNIT_PRICE",
      );
    }

    if (resolvedUnit < 0) {
      throw new AppError("Preco unitario invalido.", 400, "INVALID_UNIT_PRICE");
    }

    const unitPrice = roundMoney(resolvedUnit);

    return this.cashOrderLineRepository.create({
      cashOrderId,
      productId: payload.productId,
      quantity: payload.quantity,
      unitPrice,
      notes: payload.notes ?? null,
    });
  }
}
