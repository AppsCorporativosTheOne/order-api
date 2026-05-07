import { describe, expect, it } from "vitest";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
  UpdateProductData,
} from "../../domain/products/ProductRepository.js";
import { UpdateProductUseCase } from "./UpdateProductUseCase.js";

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

describe("UpdateProductUseCase", () => {
  it("updates product fields", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new UpdateProductUseCase(repository);
    const product = await repository.create({
      name: "Agua 500ml",
      category: "Bebidas",
      department: "Geladeira",
      sellWithoutStock: "NO",
    });

    const updated = await useCase.execute(product.id, { name: "Agua Mineral 500ml" });

    expect(updated.name).toBe("Agua Mineral 500ml");
  });

  it("rejects duplicate name from another product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new UpdateProductUseCase(repository);
    const a = await repository.create({
      name: "Suco",
      category: "Bebidas",
      department: "Geladeira",
      sellWithoutStock: "YES",
    });
    await repository.create({
      name: "Limonada",
      category: "Bebidas",
      department: "Geladeira",
      sellWithoutStock: "YES",
    });

    await expect(useCase.execute(a.id, { name: "limonada" })).rejects.toMatchObject({
      code: "PRODUCT_ALREADY_EXISTS",
      statusCode: 409,
    });
  });

  it("allows keeping the same name on the same product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new UpdateProductUseCase(repository);
    const product = await repository.create({
      name: "Cha",
      category: "Bebidas",
      department: "Quentes",
      sellWithoutStock: "NO",
    });

    await expect(useCase.execute(product.id, { name: "CHA" })).resolves.toMatchObject({
      id: product.id,
    });
  });

  it("404 for unknown product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new UpdateProductUseCase(repository);

    await expect(
      useCase.execute(crypto.randomUUID(), { name: "Outro nome" }),
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("400 for empty patch", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new UpdateProductUseCase(repository);
    const product = await repository.create({
      name: "Pao",
      category: "Padaria",
      department: "Loja",
      sellWithoutStock: "NO",
    });

    await expect(useCase.execute(product.id, {})).rejects.toMatchObject({
      code: "PRODUCT_UPDATE_EMPTY_BODY",
      statusCode: 400,
    });
  });
});
