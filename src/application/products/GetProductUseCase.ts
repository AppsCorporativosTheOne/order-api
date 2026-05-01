import { AppError } from "../../domain/errors/AppError.js";
import { ProductRepository } from "../../domain/products/ProductRepository.js";

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new AppError("Produto nao encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return product;
  }
}
