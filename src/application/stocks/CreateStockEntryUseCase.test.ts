import { describe, expect, it } from "vitest";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
} from "../../domain/products/ProductRepository.js";
import { StockEntry } from "../../domain/stocks/StockEntry.js";
import {
  CreateStockEntryData,
  ListStockEntriesFilters,
  StockEntryRepository,
} from "../../domain/stocks/StockEntryRepository.js";
import { CreateStockEntryUseCase } from "./CreateStockEntryUseCase.js";

class InMemoryProductRepository implements ProductRepository {
  private products: Product[] = [];

  async create(data: CreateProductData): Promise<Product> {
    const product: Product = {
      id: crypto.randomUUID(),
      brand: data.brand ?? null,
      name: data.name,
      category: data.category,
      department: data.department,
      sellWithoutStock: data.sellWithoutStock,
      createdAt: new Date(),
    };

    this.products.push(product);

    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findByName(name: string): Promise<Product | null> {
    return this.products.find((product) => product.name.toLowerCase() === name.toLowerCase()) ?? null;
  }

  async list(_filters: ListProductsFilters): Promise<Product[]> {
    return this.products;
  }
}

class InMemoryStockEntryRepository implements StockEntryRepository {
  private stockEntries: StockEntry[] = [];

  async create(data: CreateStockEntryData): Promise<StockEntry> {
    const stockEntry: StockEntry = {
      id: crypto.randomUUID(),
      productId: data.productId,
      quantity: data.quantity,
      manufacturingDate: data.manufacturingDate ?? null,
      expirationDate: data.expirationDate ?? null,
      unitValue: data.unitValue,
      cost: data.cost,
      finalValue: Number((data.quantity * data.unitValue).toFixed(2)),
      createdAt: new Date(),
    };

    this.stockEntries.push(stockEntry);

    return stockEntry;
  }

  async findById(id: string): Promise<StockEntry | null> {
    return this.stockEntries.find((stockEntry) => stockEntry.id === id) ?? null;
  }

  async list(_filters: ListStockEntriesFilters): Promise<StockEntry[]> {
    return this.stockEntries;
  }
}

describe("CreateStockEntryUseCase", () => {
  it("creates a stock entry for an existing product", async () => {
    const productRepository = new InMemoryProductRepository();
    const stockEntryRepository = new InMemoryStockEntryRepository();
    const useCase = new CreateStockEntryUseCase(stockEntryRepository, productRepository);
    const product = await productRepository.create({
      name: "Cafe Expresso",
      category: "Cafes",
      department: "Bebidas",
      sellWithoutStock: "NO",
    });

    const stockEntry = await useCase.execute({
      productId: product.id,
      quantity: 10,
      manufacturingDate: new Date("2026-04-20T00:00:00.000Z"),
      expirationDate: new Date("2026-07-20T00:00:00.000Z"),
      unitValue: 8.5,
      cost: 4,
    });

    expect(stockEntry.productId).toBe(product.id);
    expect(stockEntry.finalValue).toBe(85);
  });

  it("does not create stock for an unknown product", async () => {
    const productRepository = new InMemoryProductRepository();
    const stockEntryRepository = new InMemoryStockEntryRepository();
    const useCase = new CreateStockEntryUseCase(stockEntryRepository, productRepository);

    await expect(
      useCase.execute({
        productId: crypto.randomUUID(),
        quantity: 10,
        unitValue: 8.5,
        cost: 4,
      }),
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("does not create stock with expiration before manufacturing", async () => {
    const productRepository = new InMemoryProductRepository();
    const stockEntryRepository = new InMemoryStockEntryRepository();
    const useCase = new CreateStockEntryUseCase(stockEntryRepository, productRepository);
    const product = await productRepository.create({
      name: "Pao de Queijo",
      category: "Salgados",
      department: "Alimentos",
      sellWithoutStock: "NO",
    });

    await expect(
      useCase.execute({
        productId: product.id,
        quantity: 10,
        manufacturingDate: new Date("2026-05-10T00:00:00.000Z"),
        expirationDate: new Date("2026-05-01T00:00:00.000Z"),
        unitValue: 5,
        cost: 2,
      }),
    ).rejects.toMatchObject({
      code: "INVALID_EXPIRATION_DATE",
      statusCode: 400,
    });
  });
});
