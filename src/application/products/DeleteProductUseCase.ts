import type { DatabaseError } from "pg";
import { AppError } from "../../domain/errors/AppError.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";

function isForeignKeyViolation(error: unknown): error is DatabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DatabaseError).code === "23503"
  );
}

export class DeleteProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string) {
    const existing = await this.productRepository.findById(id);

    if (!existing) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    try {
      const deleted = await this.productRepository.delete(id);

      if (!deleted) {
        throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
      }
    } catch (error: unknown) {
      if (isForeignKeyViolation(error)) {
        throw new AppError(
          "Produto possui registros no estoque. Remova-os antes ou reatribua o estoque.",
          409,
          "PRODUCT_BLOCKED_BY_DEPENDENCIES",
        );
      }

      throw error;
    }
  }
}
