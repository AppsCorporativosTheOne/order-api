import { describe, expect, it } from "vitest";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
  UpdateProductData,
} from "../../domain/products/ProductRepository.js";
import { DeleteProductUseCase } from "./DeleteProductUseCase.js";

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

describe("DeleteProductUseCase", () => {
  it("deletes an existing product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new DeleteProductUseCase(repository);
    const product = await repository.create({
      name: "Temporario",
      category: "X",
      department: "Y",
      sellWithoutStock: "NO",
    });

    await useCase.execute(product.id);

    expect(await repository.findById(product.id)).toBeNull();
  });

  it("404 for unknown product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new DeleteProductUseCase(repository);

    await expect(useCase.execute(crypto.randomUUID())).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("maps foreign key violations to PRODUCT_BLOCKED_BY_DEPENDENCIES", async () => {
    const product: Product = {
      id: crypto.randomUUID(),
      brand: null,
      name: "Com estoque ref",
      category: "C",
      department: "D",
      sellWithoutStock: "NO",
      active: true,
      salePrice: 5,
      createdAt: new Date(),
    };

    const repository: ProductRepository = {
      async create() {
        throw new Error("unused");
      },
      async findById() {
        return product;
      },
      async findByName() {
        return null;
      },
      async list() {
        return [];
      },
      async update() {
        return null;
      },
      async delete() {
        const error = Object.assign(new Error("fk"), { code: "23503" });
        throw error;
      },
    };

    const useCase = new DeleteProductUseCase(repository);

    await expect(useCase.execute(product.id)).rejects.toMatchObject({
      code: "PRODUCT_BLOCKED_BY_DEPENDENCIES",
      statusCode: 409,
    });
  });
});
