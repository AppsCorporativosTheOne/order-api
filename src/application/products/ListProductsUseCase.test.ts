import { describe, expect, it, vi } from "vitest";
import type { ProductRepository } from "../../domain/products/ProductRepository.js";
import { ListProductsUseCase } from "./ListProductsUseCase.js";

describe("ListProductsUseCase", () => {
  it("repassa filtros ao repositorio", async () => {
    const productRepositoryMock = {
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as ProductRepository;

    const useCase = new ListProductsUseCase(productRepositoryMock);

    await useCase.execute({
      search: "cafe",
      eligibleForSale: true,
      activeOnly: true,
      category: "Bebidas",
      department: "Bar",
    });

    expect(productRepositoryMock.list).toHaveBeenCalledWith({
      search: "cafe",
      eligibleForSale: true,
      activeOnly: true,
      category: "Bebidas",
      department: "Bar",
    });
  });
});
