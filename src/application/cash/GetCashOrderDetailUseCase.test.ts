import { describe, expect, it, vi } from "vitest";
import type { CashOrderLineRepository } from "../../domain/cash/CashOrderLineRepository.js";
import type { CashOrderRepository } from "../../domain/cash/CashOrderRepository.js";
import { GetCashOrderDetailUseCase } from "./GetCashOrderDetailUseCase.js";

describe("GetCashOrderDetailUseCase", () => {
  it("agrupa linhas totais monetarios corretamente", async () => {
    const orderId = "f0000001-0000-4000-8000-000000000098";
    const lines = [
      {
        id: "a1",
        cashOrderId: orderId,
        productId: "p1",
        quantity: 2,
        unitPrice: 5,
        lineTotal: 10,
        notes: null,
        createdAt: new Date(),
      },
      {
        id: "a2",
        cashOrderId: orderId,
        productId: "p2",
        quantity: 1,
        unitPrice: 3.33,
        lineTotal: 3.33,
        notes: null,
        createdAt: new Date(),
      },
    ];

    const cashOrderRepository = {
      findById: vi.fn().mockResolvedValue({
        id: orderId,
        cashDaySessionId: "d",
        cashOperatorSessionId: "op",
        diningTableId: null,
        status: "OPEN" as const,
        notes: null,
        openedAt: new Date(),
        closedAt: null,
        consumedTotal: null,
      }),
    } as unknown as CashOrderRepository;

    const cashOrderLineRepository = {
      listByCashOrderId: vi.fn().mockResolvedValue(lines),
      sumLineTotalByCashOrderId: vi.fn().mockResolvedValue(13.33),
      create: vi.fn(),
    } as unknown as CashOrderLineRepository;

    const useCase = new GetCashOrderDetailUseCase(cashOrderRepository, cashOrderLineRepository);

    const result = await useCase.execute(orderId);

    expect(result.lines.length).toBe(2);
    expect(result.linesTotal).toBe(13.33);
    expect(result.order.id).toBe(orderId);
  });
});
