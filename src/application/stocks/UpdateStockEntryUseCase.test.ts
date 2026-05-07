import { describe, expect, it } from "vitest";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
  UpdateProductData,
} from "../../domain/products/ProductRepository.js";
import { StockEntry } from "../../domain/stocks/StockEntry.js";
import {
  CreateStockEntryData,
  ListStockEntriesFilters,
  StockEntryRepository,
  UpdateStockEntryData,
} from "../../domain/stocks/StockEntryRepository.js";
import { UpdateStockEntryUseCase } from "./UpdateStockEntryUseCase.js";

class InMemoryProductRepository implements ProductRepository {
  constructor(private readonly products: Product[]) {}

  async create(data: CreateProductData): Promise<Product> {
    const product: Product = {
      id: crypto.randomUUID(),
      brand: data.brand ?? null,
      name: data.name,
      category: data.category,
      department: data.department,
      sellWithoutStock: data.sellWithoutStock,
      active: data.active ?? true,
      salePrice: data.salePrice !== undefined ? data.salePrice : null,
      createdAt: new Date(),
    };

    this.products.push(product);

    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async findByName(name: string): Promise<Product | null> {
    return (
      this.products.find((product) => product.name.toLowerCase() === name.toLowerCase()) ?? null
    );
  }

  async list(_filters: ListProductsFilters): Promise<Product[]> {
    return this.products;
  }

  async update(id: string, data: UpdateProductData): Promise<Product | null> {
    const idx = this.products.findIndex((product) => product.id === id);

    if (idx === -1) {
      return null;
    }

    const prev = this.products[idx];
    const next: Product = {
      ...prev,
      ...(data.brand !== undefined ? { brand: data.brand } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      ...(data.sellWithoutStock !== undefined
        ? { sellWithoutStock: data.sellWithoutStock }
        : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
      ...(data.salePrice !== undefined ? { salePrice: data.salePrice } : {}),
    };

    this.products[idx] = next;

    return next;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.products.findIndex((product) => product.id === id);

    if (idx === -1) {
      return false;
    }

    this.products.splice(idx, 1);

    return true;
  }
}

class InMemoryStockEntryRepository implements StockEntryRepository {
  constructor(private readonly stockEntries: StockEntry[]) {}

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

  async update(id: string, data: UpdateStockEntryData): Promise<StockEntry | null> {
    const idx = this.stockEntries.findIndex((entry) => entry.id === id);

    if (idx === -1) {
      return null;
    }

    const prev = this.stockEntries[idx];
    const productId = data.productId ?? prev.productId;
    const quantity = data.quantity ?? prev.quantity;
    const unitValue = data.unitValue ?? prev.unitValue;
    const manufacturingDate =
      data.manufacturingDate !== undefined ? data.manufacturingDate : prev.manufacturingDate;
    const expirationDate =
      data.expirationDate !== undefined ? data.expirationDate : prev.expirationDate;
    const cost = data.cost ?? prev.cost;

    const next: StockEntry = {
      ...prev,
      productId,
      quantity,
      unitValue,
      manufacturingDate,
      expirationDate,
      cost,
      finalValue: Number((quantity * unitValue).toFixed(2)),
    };

    this.stockEntries[idx] = next;

    return next;
  }

  async sumQuantityByProductId(productId: string): Promise<number> {
    return this.stockEntries
      .filter((entry) => entry.productId === productId)
      .reduce((sum, entry) => sum + entry.quantity, 0);
  }
}

describe("UpdateStockEntryUseCase", () => {
  async function fixtures() {
    const products: Product[] = [];
    const stockEntries: StockEntry[] = [];
    const productRepository = new InMemoryProductRepository(products);
    const stockRepository = new InMemoryStockEntryRepository(stockEntries);

    const p1 = await productRepository.create({
      name: "A",
      category: "C",
      department: "D",
      sellWithoutStock: "NO",
    });
    const p2 = await productRepository.create({
      name: "B",
      category: "C",
      department: "D",
      sellWithoutStock: "YES",
    });

    const entry = await stockRepository.create({
      productId: p1.id,
      quantity: 5,
      manufacturingDate: new Date("2026-05-01T00:00:00.000Z"),
      expirationDate: new Date("2026-08-01T00:00:00.000Z"),
      unitValue: 10,
      cost: 3,
    });

    return {
      products,
      productRepository,
      stockRepository,
      stockEntries,
      p1,
      p2,
      entry,
      useCase: new UpdateStockEntryUseCase(stockRepository, productRepository),
    };
  }

  it("updates quantity and recalculates final value semantics", async () => {
    const { useCase, entry } = await fixtures();
    const updated = await useCase.execute(entry.id, { quantity: 2 });

    expect(updated.quantity).toBe(2);
    expect(updated.finalValue).toBe(20);
  });

  it("404 for unknown stock entry id", async () => {
    const { useCase } = await fixtures();

    await expect(
      useCase.execute(crypto.randomUUID(), { quantity: 1 }),
    ).rejects.toMatchObject({
      code: "STOCK_ENTRY_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("404 when targeting unknown product via productId", async () => {
    const { useCase, entry } = await fixtures();

    await expect(
      useCase.execute(entry.id, { productId: crypto.randomUUID() }),
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("allows reassign to another existing product", async () => {
    const { useCase, entry, p2 } = await fixtures();

    const updated = await useCase.execute(entry.id, { productId: p2.id });

    expect(updated.productId).toBe(p2.id);
  });

  it("rejects expiration before manufacturing with merged dates", async () => {
    const { useCase, entry } = await fixtures();

    await expect(
      useCase.execute(entry.id, { expirationDate: new Date("2026-04-01T00:00:00.000Z") }),
    ).rejects.toMatchObject({
      code: "INVALID_EXPIRATION_DATE",
      statusCode: 400,
    });
  });

  it("400 empty body", async () => {
    const { useCase, entry } = await fixtures();

    await expect(useCase.execute(entry.id, {})).rejects.toMatchObject({
      code: "STOCK_ENTRY_UPDATE_EMPTY_BODY",
      statusCode: 400,
    });
  });
});
