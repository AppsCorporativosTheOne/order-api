import { describe, expect, it } from "vitest";
import { Product } from "../../domain/products/Product.js";
import {
  CreateProductData,
  ListProductsFilters,
  ProductRepository,
} from "../../domain/products/ProductRepository.js";
import { CreateProductUseCase } from "./CreateProductUseCase.js";

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

describe("CreateProductUseCase", () => {
  it("creates a product", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new CreateProductUseCase(repository);

    const product = await useCase.execute({
      brand: "Coca-Cola",
      name: "Coca-Cola Lata 350ml",
      category: "Refrigerantes",
      department: "Bebidas",
      sellWithoutStock: "NO",
    });

    expect(product.id).toEqual(expect.any(String));
    expect(product.name).toBe("Coca-Cola Lata 350ml");
  });

  it("does not create two products with the same name", async () => {
    const repository = new InMemoryProductRepository();
    const useCase = new CreateProductUseCase(repository);

    await useCase.execute({
      name: "Cafe Expresso",
      category: "Cafes",
      department: "Bebidas",
      sellWithoutStock: "YES",
    });

    await expect(
      useCase.execute({
        name: "cafe expresso",
        category: "Cafes",
        department: "Bebidas",
        sellWithoutStock: "YES",
      }),
    ).rejects.toMatchObject({
      code: "PRODUCT_ALREADY_EXISTS",
      statusCode: 409,
    });
  });
});
