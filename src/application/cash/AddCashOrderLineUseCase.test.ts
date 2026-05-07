import { describe, expect, it, vi } from "vitest";
import { CashDaySessionRepository } from "../../domain/cash/CashDaySessionRepository.js";
import { CashOrderLineRepository } from "../../domain/cash/CashOrderLineRepository.js";
import { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";
import { StockEntryRepository } from "../../domain/stocks/StockEntryRepository.js";
import { CashOrderLine } from "../../domain/cash/CashOrderLine.js";
import { AddCashOrderLineUseCase } from "./AddCashOrderLineUseCase.js";

describe("AddCashOrderLineUseCase", () => {
  const orderId = "f0000001-0000-4000-8000-000000000099";
  const productId = "b0000001-0000-4000-8000-000000000099";
  const dayId = "c0000001-0000-4000-8000-000000000099";

  function buildDeps(overrides: {
    dayOpen?: boolean;
    order?: { status: "OPEN" | "CLOSED" };
    product?: {
      active: boolean;
      sellWithoutStock: "YES" | "NO";
      salePrice: number | null;
    };
    stockQty?: number;
  }) {
    const cashDaySessionRepository = {
      findById: vi.fn().mockResolvedValue(
        overrides.dayOpen === false ? { id: dayId, status: "CLOSED" } : { id: dayId, status: "OPEN" },
      ),
    } as unknown as CashDaySessionRepository;

    const cashOrderRepository = {
      findById: vi.fn().mockResolvedValue({
        id: orderId,
        cashDaySessionId: dayId,
        cashOperatorSessionId: "d0000001-0000-4000-8000-000000000099",
        diningTableId: null,
        status: overrides.order?.status ?? "OPEN",
        notes: null,
        openedAt: new Date(),
        closedAt: null,
        consumedTotal: null,
      }),
    } as unknown as CashOrderRepository;

    const cashOrderLineRepository = {
      create: vi.fn().mockImplementation(async (d) => {
        const lineTotal = Math.round(d.quantity * d.unitPrice * 100) / 100;
        const line: CashOrderLine = {
          id: "deadbeef-dead-beef-dead-beefdeadbeef",
          cashOrderId: d.cashOrderId,
          productId: d.productId,
          quantity: d.quantity,
          unitPrice: d.unitPrice,
          lineTotal,
          notes: d.notes ?? null,
          createdAt: new Date(),
        };
        return line;
      }),
      listByCashOrderId: vi.fn(),
      sumLineTotalByCashOrderId: vi.fn(),
    } as unknown as CashOrderLineRepository;

    const productRepository = {
      findById: vi.fn().mockResolvedValue(
        overrides.product
          ? {
              id: productId,
              brand: null,
              name: "Item",
              category: "X",
              department: "Y",
              active: overrides.product.active,
              sellWithoutStock: overrides.product.sellWithoutStock,
              salePrice: overrides.product.salePrice,
              createdAt: new Date(),
            }
          : null,
      ),
    } as unknown as ProductRepository;

    const stockEntryRepository = {
      sumQuantityByProductId: vi.fn().mockResolvedValue(overrides.stockQty ?? 10),
      create: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
    } as unknown as StockEntryRepository;

    return new AddCashOrderLineUseCase(
      cashDaySessionRepository,
      cashOrderRepository,
      cashOrderLineRepository,
      productRepository,
      stockEntryRepository,
    );
  }

  it("cadastra linha usando salePrice quando unitPrice omitido", async () => {
    const useCase = buildDeps({
      product: { active: true, sellWithoutStock: "NO", salePrice: 10 },
      stockQty: 5,
    });

    await expect(useCase.execute(orderId, { productId, quantity: 2 })).resolves.toMatchObject({
      quantity: 2,
      unitPrice: 10,
    });
  });

  it("prioriza unitPrice informado explicitamente no corpo", async () => {
    const useCase = buildDeps({
      product: { active: true, sellWithoutStock: "NO", salePrice: 10 },
      stockQty: 5,
    });

    await expect(
      useCase.execute(orderId, { productId, quantity: 1, unitPrice: 99.55 }),
    ).resolves.toMatchObject({
      quantity: 1,
      unitPrice: 99.55,
      lineTotal: 99.55,
    });
  });

  it("erro MISSING_UNIT_PRICE quando nao ha unitPrice nem salePrice no produto", async () => {
    const useCase = buildDeps({
      product: { active: true, sellWithoutStock: "NO", salePrice: null },
      stockQty: 10,
    });

    await expect(useCase.execute(orderId, { productId, quantity: 1 })).rejects.toMatchObject({
      code: "MISSING_UNIT_PRICE",
      statusCode: 400,
    });
  });

  it("rejeita produto sem estoque quando sellWithoutStock e NO", async () => {
    const useCase = buildDeps({
      product: { active: true, sellWithoutStock: "NO", salePrice: 1 },
      stockQty: 0,
    });

    await expect(useCase.execute(orderId, { productId, quantity: 1 })).rejects.toMatchObject({
      code: "PRODUCT_OUT_OF_STOCK",
      statusCode: 409,
    });
  });

  it("permite mesmo sem stock quando sellWithoutStock e YES", async () => {
    const useCase = buildDeps({
      product: { active: true, sellWithoutStock: "YES", salePrice: 12 },
      stockQty: 0,
    });

    await expect(useCase.execute(orderId, { productId, quantity: 1 })).resolves.toBeDefined();
  });

  it("rejeita pedido encerrado", async () => {
    const useCase = buildDeps({ order: { status: "CLOSED" }, product: { active: true, sellWithoutStock: "YES", salePrice: 1 } });

    await expect(useCase.execute(orderId, { productId, quantity: 1 })).rejects.toMatchObject({
      code: "CASH_ORDER_ALREADY_CLOSED",
      statusCode: 409,
    });
  });

  it("rejeita dia de caixa fechado", async () => {
    const useCase = buildDeps({
      dayOpen: false,
      product: { active: true, sellWithoutStock: "YES", salePrice: 1 },
      stockQty: 0,
    });

    await expect(useCase.execute(orderId, { productId, quantity: 1 })).rejects.toMatchObject({
      code: "CASH_DAY_CLOSED",
      statusCode: 409,
    });
  });
});
