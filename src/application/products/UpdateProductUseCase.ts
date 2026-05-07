import { AppError } from "../../domain/errors/AppError.js";
import {
  ProductRepository,
  UpdateProductData,
} from "../../domain/products/ProductRepository.js";

export class UpdateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string, data: UpdateProductData) {
    const existing = await this.productRepository.findById(id);

    if (!existing) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    if (!Object.keys(data).length) {
      throw new AppError(
        "Informe ao menos um campo para atualizar.",
        400,
        "PRODUCT_UPDATE_EMPTY_BODY",
      );
    }

    if (data.name !== undefined) {
      const productWithSameName = await this.productRepository.findByName(data.name);

      if (productWithSameName && productWithSameName.id !== id) {
        throw new AppError(
          "Produto ja cadastrado com este nome.",
          409,
          "PRODUCT_ALREADY_EXISTS",
        );
      }
    }

    const updated = await this.productRepository.update(id, data);

    if (!updated) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return updated;
  }
}
